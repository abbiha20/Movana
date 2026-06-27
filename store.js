// store.js - Persistent LocalStorage Store for Movana

const STORE_KEY = 'movana_store_data';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to anonymize company/user names deterministic based on user ID
const anonymizeName = (role, userId) => {
  if (!userId) return role === 'shipper' ? 'Shipper' : 'Carrier';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().substring(0, 4);
  const prefix = role === 'shipper' ? 'Shipper' : 'Carrier';
  return `${prefix} ${hex}`;
};

// Backend Authorization / Masking Helper to protect street addresses & coordinates
const maskShipment = (shipment, currentUser) => {
  if (!shipment) return null;
  
  // Clone to avoid modifying the in-memory database store
  const clone = JSON.parse(JSON.stringify(shipment));
  
  const isAwarded = clone.status === 'awarded' || clone.status === 'in transit' || clone.status === 'delivered' || clone.status === 'completed';
  const isAuthorized = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.id === clone.shipperId ||
    (isAwarded && clone.carrierId && currentUser.id === clone.carrierId)
  );
  
  if (!isAuthorized) {
    clone.hasFullAddress = !!(clone.originStreetAddress || clone.destinationStreetAddress);
    // Strip private street addresses and exact coordinates
    clone.originStreetAddress = '';
    clone.destinationStreetAddress = '';
    clone.originLat = '';
    clone.originLon = '';
    clone.destinationLat = '';
    clone.destinationLon = '';
    clone.originZip = '';
    clone.destinationZip = '';
    
    // Format origin/destination public fields to City, State only
    if (clone.originCity && clone.originState) {
      clone.origin = `${clone.originCity}, ${clone.originState}`;
    }
    if (clone.destinationCity && clone.destinationState) {
      clone.destination = `${clone.destinationCity}, ${clone.destinationState}`;
    }
  }
  
  // Mask shipper and carrier names globally if not awarded
  const revealShipperName = currentUser && (currentUser.role === 'admin' || currentUser.id === clone.shipperId);
  if (!revealShipperName) {
    clone.shipperName = anonymizeName('shipper', clone.shipperId);
  }
  
  const revealCarrierName = currentUser && (
    currentUser.role === 'admin' || 
    (isAwarded && clone.carrierId && currentUser.id === clone.carrierId) ||
    (clone.carrierId && currentUser.id === clone.carrierId)
  );
  if (clone.carrierId && !revealCarrierName) {
    clone.carrierName = anonymizeName('carrier', clone.carrierId);
  }
  
  return clone;
};

// Backend Authorization / Masking Helper for bids to isolate them by role/ownership
const maskBid = (bid, currentUser, shipment) => {
  if (!bid) return null;
  
  const clone = JSON.parse(JSON.stringify(bid));
  
  const isCarrierSelf = currentUser && currentUser.id === clone.carrierId;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isShipperOwner = shipment && currentUser && currentUser.id === shipment.shipperId;
  
  const canSeeBid = isAdmin || isCarrierSelf || isShipperOwner;
  if (!canSeeBid) return null;
  
  const isShipmentAwardedToThisCarrier = shipment && 
    (shipment.status === 'awarded' || shipment.status === 'in transit' || shipment.status === 'delivered' || shipment.status === 'completed') && 
    shipment.carrierId === clone.carrierId;
    
  const revealRealDetails = isAdmin || isCarrierSelf || isShipmentAwardedToThisCarrier;
  
  if (!revealRealDetails) {
    clone.carrierName = anonymizeName('carrier', clone.carrierId);
  }
  
  return clone;
};

// Backend Authorization / Masking Helper for user accounts to isolate phone/email
const maskUser = (user, currentUser) => {
  if (!user) return null;
  
  const clone = JSON.parse(JSON.stringify(user));
  delete clone.password;
  
  let sharesAwardedShipment = false;
  if (currentUser) {
    sharesAwardedShipment = data.shipments.some(s => 
      (s.status === 'awarded' || s.status === 'in transit' || s.status === 'delivered' || s.status === 'completed') && 
      ((s.shipperId === currentUser.id && s.carrierId === clone.id) ||
       (s.shipperId === clone.id && s.carrierId === currentUser.id))
    );
  }
  
  const isAuthorized = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.id === clone.id ||
    sharesAwardedShipment
  );
  
  if (!isAuthorized) {
    clone.phone = '';
    clone.email = '';
    clone.companyName = anonymizeName(clone.role, clone.id);
    clone.contactName = anonymizeName(clone.role, clone.id);
  }
  
  return clone;
};


// Mock SVG Cover Images for seed shipments
const MOCK_COVER_MACHINERY = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><rect width="100%" height="100%" fill="#e2e8f0"/><rect x="60" y="110" width="280" height="30" fill="#334155" rx="3"/><rect x="80" y="140" width="40" height="15" fill="#1e293b"/><rect x="280" y="140" width="40" height="15" fill="#1e293b"/><rect x="120" y="60" width="160" height="50" fill="#0284c7" rx="4"/><path d="M150 85 L250 85 M200 65 L200 105" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><circle cx="200" cy="85" r="15" fill="none" stroke="#ffffff" stroke-width="4"/><text x="200" y="200" font-family="Outfit, sans-serif" font-size="16" font-weight="700" fill="#475569" text-anchor="middle">Heavy Industrial Parts</text></svg>')}`;

const MOCK_COVER_ORANGES = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><rect width="100%" height="100%" fill="#fef3c7"/><rect x="60" y="110" width="280" height="30" fill="#475569" rx="3"/><rect x="80" y="140" width="40" height="15" fill="#1e293b"/><rect x="280" y="140" width="40" height="15" fill="#1e293b"/><circle cx="200" cy="85" r="28" fill="#f97316"/><path d="M195 57 C200 50 215 52 210 60" stroke="#16a34a" stroke-width="4" fill="none" stroke-linecap="round"/><text x="200" y="200" font-family="Outfit, sans-serif" font-size="16" font-weight="700" fill="#78350f" text-anchor="middle">Refrigerated Oranges</text></svg>')}`;

const MOCK_COVER_ELECTRONICS = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><rect width="100%" height="100%" fill="#f3e8ff"/><rect x="60" y="110" width="280" height="30" fill="#581c87" rx="3"/><rect x="80" y="140" width="40" height="15" fill="#1e293b"/><rect x="280" y="140" width="40" height="15" fill="#1e293b"/><rect x="130" y="60" width="140" height="50" fill="#a855f7" rx="4"/><rect x="145" y="70" width="110" height="8" fill="#e9d5ff" rx="1"/><rect x="145" y="85" width="110" height="8" fill="#e9d5ff" rx="1"/><circle cx="230" cy="74" r="2" fill="#22c55e"/><circle cx="230" cy="89" r="2" fill="#22c55e"/><text x="200" y="200" font-family="Outfit, sans-serif" font-size="16" font-weight="700" fill="#6b21a8" text-anchor="middle">Consumer Electronics</text></svg>')}`;

const MOCK_COVER_LETTUCE = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%"><rect width="100%" height="100%" fill="#dcfce7"/><rect x="60" y="110" width="280" height="30" fill="#15803d" rx="3"/><rect x="80" y="140" width="40" height="15" fill="#1e293b"/><rect x="280" y="140" width="40" height="15" fill="#1e293b"/><path d="M170 90 Q185 60 200 90 T230 90" fill="none" stroke="#22c55e" stroke-width="5" stroke-linecap="round"/><path d="M180 80 Q195 55 210 80" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round"/><text x="200" y="200" font-family="Outfit, sans-serif" font-size="16" font-weight="700" fill="#14532d" text-anchor="middle">Fresh Farm Produce</text></svg>')}`;

// Initial seed data if localStorage is empty
const defaultSeedData = {
  users: [
    { id: 'u_shipper1', username: 'shipper1', password: 'password', role: 'shipper', companyName: 'Atlas Freight Inc', contactName: 'John Davis', phone: '1-800-555-0199', email: 'dispatch@atlasfreight.com' },
    { id: 'u_shipper2', username: 'shipper2', password: 'password', role: 'shipper', companyName: 'Greenwood Produce', contactName: 'Sarah Greenwood', phone: '1-863-555-0142', email: 'logistics@greenwoodproduce.com' },
    { id: 'u_carrier1', username: 'carrier1', password: 'password', role: 'carrier', companyName: 'Titan Trucking & Logistics', contactName: 'Robert Titan', phone: '1-800-555-0275', email: 'loads@titantrucking.com' },
    { id: 'u_carrier2', username: 'carrier2', password: 'password', role: 'carrier', companyName: 'SwiftFlow Transport', contactName: 'Emma Swift', phone: '1-888-555-0311', email: 'bookings@swiftflowtransport.com' }
  ],
  shipments: [
    {
      id: 'ship_1',
      shipperId: 'u_shipper1',
      shipperName: 'Atlas Freight Inc',
      origin: 'LaGrange, GA',
      destination: 'Saint Martin Parish, LA',
      cargoType: 'Industrial Machinery',
      weight: 18500,
      dimensions: '24x8x8 ft',
      pickupDate: '2026-07-02',
      budget: 4200,
      description: 'Palletized machinery parts. Requires heavy duty tie-downs and tarping. Flatbed truck.',
      status: 'open',
      carrierId: null,
      carrierName: null,
      createdAt: '2026-06-20T10:00:00.000Z',
      coverImage: MOCK_COVER_MACHINERY,
      originStreetAddress: '110 Old Airport Road',
      originCity: 'LaGrange',
      originState: 'GA',
      originZip: '30240',
      originLat: '33.0360',
      originLon: '-85.0313',
      destinationStreetAddress: '100 Depot St',
      destinationCity: 'Saint Martin Parish',
      destinationState: 'LA',
      destinationZip: '70582',
      destinationLat: '30.1500',
      destinationLon: '-91.7000',
      priority: 'priority',
      routeDistance: 505,
      routeDuration: '7 hr 40 min',
      equipmentRequired: 'Flatbed'
    },
    {
      id: 'ship_2',
      shipperId: 'u_shipper2',
      shipperName: 'Greenwood Produce',
      origin: 'Orlando, FL',
      destination: 'New York, NY',
      cargoType: 'Refrigerated Oranges',
      weight: 42000,
      dimensions: '53x8x8.5 ft',
      pickupDate: '2026-06-30',
      budget: 6500,
      description: 'Reefer set at 36°F. High value cargo. No delays allowed.',
      status: 'open',
      carrierId: null,
      carrierName: null,
      createdAt: '2026-06-22T08:30:00.000Z',
      coverImage: MOCK_COVER_ORANGES,
      originStreetAddress: '8000 S Orange Blossom Trail',
      originCity: 'Orlando',
      originState: 'FL',
      originZip: '32809',
      originLat: '28.4500',
      originLon: '-81.3900',
      destinationStreetAddress: '423 W 14th St',
      destinationCity: 'New York',
      destinationState: 'NY',
      destinationZip: '10014',
      destinationLat: '40.7410',
      destinationLon: '-74.0060',
      priority: 'flexible',
      routeDistance: 950,
      routeDuration: '14 hr 30 min',
      equipmentRequired: 'Dry Van'
    },
    {
      id: 'ship_3',
      shipperId: 'u_shipper1',
      shipperName: 'Atlas Freight Inc',
      origin: 'Seattle, WA',
      destination: 'Los Angeles, CA',
      cargoType: 'Electronics',
      weight: 8000,
      dimensions: '20x8x8 ft',
      pickupDate: '2026-06-28',
      budget: 2900,
      description: 'Fragile electronic components in dry van. Double-decking prohibited.',
      status: 'awarded',
      carrierId: 'u_carrier1',
      carrierName: 'Titan Trucking & Logistics',
      createdAt: '2026-06-18T14:00:00.000Z',
      coverImage: MOCK_COVER_ELECTRONICS,
      originStreetAddress: '2201 Westlake Ave',
      originCity: 'Seattle',
      originState: 'WA',
      originZip: '98121',
      originLat: '47.6160',
      originLon: '-122.3380',
      destinationStreetAddress: '1111 S Figueroa St',
      destinationCity: 'Los Angeles',
      destinationState: 'CA',
      destinationZip: '90015',
      destinationLat: '34.0430',
      destinationLon: '-118.2670',
      priority: 'flexible',
      routeDistance: 1135,
      routeDuration: '17 hr 10 min',
      equipmentRequired: 'Dry Van'
    },
    {
      id: 'ship_4',
      shipperId: 'u_shipper2',
      shipperName: 'Greenwood Produce',
      origin: 'Phoenix, AZ',
      destination: 'Denver, CO',
      cargoType: 'Fresh Lettuce',
      weight: 35000,
      dimensions: '53x8x8 ft',
      pickupDate: '2026-06-15',
      budget: 3800,
      description: 'Reefer set at 34°F.',
      status: 'delivered',
      carrierId: 'u_carrier2',
      carrierName: 'SwiftFlow Transport',
      createdAt: '2026-06-12T09:00:00.000Z',
      coverImage: MOCK_COVER_LETTUCE,
      originStreetAddress: '3400 E Sky Harbor Blvd',
      originCity: 'Phoenix',
      originState: 'AZ',
      originZip: '85034',
      originLat: '33.4370',
      originLon: '-112.0080',
      destinationStreetAddress: '1701 Wynkoop St',
      destinationCity: 'Denver',
      destinationState: 'CO',
      destinationZip: '80202',
      destinationLat: '39.7530',
      destinationLon: '-104.9990',
      priority: 'priority',
      routeDistance: 820,
      routeDuration: '12 hr 20 min',
      equipmentRequired: 'Dry Van'
    }
  ],
  bids: [
    {
      id: 'bid_1',
      shipmentId: 'ship_1',
      carrierId: 'u_carrier1',
      carrierName: 'Titan Trucking & Logistics',
      amount: 4000,
      deliveryDate: '2026-07-05',
      message: 'Experienced with industrial cargo. We have flatbeds ready in Chicago. Reliable and fully insured.',
      status: 'pending',
      createdAt: '2026-06-21T11:00:00.000Z'
    },
    {
      id: 'bid_2',
      shipmentId: 'ship_1',
      carrierId: 'u_carrier2',
      carrierName: 'SwiftFlow Transport',
      amount: 3850,
      deliveryDate: '2026-07-04',
      message: 'We have a flatbed passing through Chicago on the 2nd. Can guarantee delivery by the 4th of July.',
      status: 'pending',
      createdAt: '2026-06-22T15:45:00.000Z'
    },
    {
      id: 'bid_3',
      shipmentId: 'ship_3',
      carrierId: 'u_carrier1',
      carrierName: 'Titan Trucking & Logistics',
      amount: 2850,
      deliveryDate: '2026-07-01',
      message: 'Can carry this easily. In dry van.',
      status: 'accepted',
      createdAt: '2026-06-19T10:00:00.000Z'
    }
  ],
  currentUser: null,
  negotiations: [],
  violations: []
};

// Internal data state
// Internal data state
let data = defaultSeedData;

// Cryptographic hash helper (SHA-256 in pure JS)
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value>>>amount) | (value<<(32-amount));
  }
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;
  var result = '';
  var words = [];
  var asciiLength = ascii[lengthProperty]*8;
  var hash = sha256.h = sha256.h || [];
  var k = sha256.k = sha256.k || [];
  var primeCounter = k[lengthProperty];
  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = i;
      }
      hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
      k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
    }
  }
  ascii += '\x80';
  while (ascii[lengthProperty]%64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i>>2] |= j << (24 - (i % 4)*8);
  }
  words[words[lengthProperty]] = ((asciiLength/maxWord)|0);
  words[words[lengthProperty]] = (asciiLength);
  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16);
    var oldHash = hash.slice(0);
    hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (i = 0; i < 64; i++) {
      var w16 = w[i - 16], w15 = w[i - 15], w7 = w[i - 7], w2 = w[i - 2];
      var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      var temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16 ? w[i] : (w16 + s0 + w7 + s1) | 0));
      var temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
      hash = [(temp1 + temp2)|0].concat(hash);
      hash[4] = (hash[4] + temp1)|0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i])|0;
    }
  }
  for (i = 0; i < 8; i++) {
    var val = hash[i];
    if (val < 0) val += 0x100000000;
    result += val.toString(16).padStart(8, '0');
  }
  return result;
}

// Load data from localStorage
const load = () => {
  const stored = localStorage.getItem(STORE_KEY);
  if (stored) {
    try {
      data = JSON.parse(stored);
      
      let migrated = false;
      if (!data.negotiations) {
        data.negotiations = [];
        migrated = true;
      }
      if (!data.violations) {
        data.violations = [];
        migrated = true;
      }
      if (!data.activityLogs) {
        data.activityLogs = [];
        migrated = true;
      }
      if (!data.ratings) {
        data.ratings = [];
        migrated = true;
      }
      
      // Auto-migrate seed users
      if (data.users) {
        data.users.forEach(u => {
          if (!u.password.match(/^[0-9a-f]{64}$/i)) {
            u.password = sha256(u.password);
            migrated = true;
          }
          if (u.emailVerified === undefined) {
            u.emailVerified = true;
            migrated = true;
          }
          if (!u.createdAt) {
            u.createdAt = new Date('2026-06-01T08:00:00Z').toISOString();
            migrated = true;
          }
          if (!u.lastLogin) {
            u.lastLogin = new Date().toISOString();
            migrated = true;
          }
          if (!u.address) {
            u.address = u.role === 'shipper' ? '123 Shipper Way' : '456 Carrier Blvd';
            u.city = 'Atlanta';
            u.state = 'GA';
            u.zip = '30303';
            u.country = 'United States';
            migrated = true;
          }
        });
      }

      // Migrate: If seed shipments do not have coverImage, priority, distance, or are outdated, update them
      data.shipments.forEach(s => {
        if (s.status === 'assigned') {
          s.status = 'awarded';
          migrated = true;
        }
        if (s.status === 'in-transit') {
          s.status = 'in transit';
          migrated = true;
        }
        if (!s.equipmentRequired) {
          if (s.id === 'ship_1') s.equipmentRequired = 'Flatbed';
          else if (s.id === 'ship_2') s.equipmentRequired = 'Dry Van';
          else if (s.id === 'ship_3') s.equipmentRequired = 'Dry Van';
          else if (s.id === 'ship_4') s.equipmentRequired = 'Dry Van';
          else s.equipmentRequired = 'Dry Van';
          migrated = true;
        }
        if (!s.priority) {
          s.priority = (s.id === 'ship_1' || s.id === 'ship_4') ? 'priority' : 'flexible';
          migrated = true;
        }
        if (s.id === 'ship_1' && s.origin === 'Chicago, IL') {
          s.origin = 'LaGrange, GA';
          s.destination = 'Saint Martin Parish, LA';
          s.originStreetAddress = '110 Old Airport Road';
          s.originCity = 'LaGrange';
          s.originState = 'GA';
          s.originZip = '30240';
          s.originLat = '33.0360';
          s.originLon = '-85.0313';
          s.destinationStreetAddress = '100 Depot St';
          s.destinationCity = 'Saint Martin Parish';
          s.destinationState = 'LA';
          s.destinationZip = '70582';
          s.destinationLat = '30.1500';
          s.destinationLon = '-91.7000';
          s.priority = 'priority';
          s.routeDistance = 505;
          s.routeDuration = '7 hr 40 min';
          migrated = true;
        }
        if (!s.routeDistance) {
          if (s.id === 'ship_1') { s.routeDistance = 505; s.routeDuration = '7 hr 40 min'; migrated = true; }
          else if (s.id === 'ship_2') { s.routeDistance = 950; s.routeDuration = '14 hr 30 min'; migrated = true; }
          else if (s.id === 'ship_3') { s.routeDistance = 1135; s.routeDuration = '17 hr 10 min'; migrated = true; }
          else if (s.id === 'ship_4') { s.routeDistance = 820; s.routeDuration = '12 hr 20 min'; migrated = true; }
        }
        if (!s.coverImage) {
          if (s.id === 'ship_1') { s.coverImage = MOCK_COVER_MACHINERY; migrated = true; }
          else if (s.id === 'ship_2') { s.coverImage = MOCK_COVER_ORANGES; migrated = true; }
          else if (s.id === 'ship_3') { s.coverImage = MOCK_COVER_ELECTRONICS; migrated = true; }
          else if (s.id === 'ship_4') { s.coverImage = MOCK_COVER_LETTUCE; migrated = true; }
        }
        if (!s.shipmentType) {
          s.shipmentType = 'Freight';
          let commodity = s.cargoType || 'General Cargo';
          if (s.id === 'ship_1') commodity = 'Industrial Machinery';
          else if (s.id === 'ship_2') commodity = 'Refrigerated Produce';
          else if (s.id === 'ship_3') commodity = 'Consumer Electronics';
          else if (s.id === 'ship_4') commodity = 'Refrigerated Produce';
          
          let pallets = 10;
          if (s.id === 'ship_1') pallets = 4;
          else if (s.id === 'ship_2') pallets = 26;
          else if (s.id === 'ship_3') pallets = 10;
          else if (s.id === 'ship_4') pallets = 24;

          s.shipmentTypeDetails = {
            commodity: commodity,
            pallets: pallets,
            weight: s.weight,
            dimensions: s.dimensions,
            stackable: false,
            hazmat: false,
            liftgate: s.id === 'ship_1'
          };
          migrated = true;
        }
      });
      if (migrated) {
        save();
      }
    } catch (e) {
      console.error('Failed to parse Movana store data, resetting to seed data.', e);
      data = defaultSeedData;
      save();
    }
  } else {
    data = defaultSeedData;
    // Hash default users
    data.users.forEach(u => {
      u.password = sha256(u.password);
      u.emailVerified = true;
      u.createdAt = new Date('2026-06-01T08:00:00Z').toISOString();
      u.lastLogin = new Date().toISOString();
      u.address = u.role === 'shipper' ? '123 Shipper Way' : '456 Carrier Blvd';
      u.city = 'Atlanta';
      u.state = 'GA';
      u.zip = '30303';
      u.country = 'United States';
    });
    data.activityLogs = [];
    data.ratings = [];
    save();
  }
};

// Save data to localStorage
const save = () => {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
};

// Initialize store
load();

const Store = {
  // Authentication & Users
  getUsers: () => {
    load();
    const currentUser = data.currentUser;
    return data.users.map(u => maskUser(u, currentUser));
  },
  
  registerUser: (username, password, role, companyName, additionalData = {}) => {
    load();
    const existingUsername = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUsername) {
      throw new Error('Username already exists. Please choose another.');
    }
    const email = additionalData.email || `${username}@movanamarketplace.com`;
    const existingEmail = data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      throw new Error('Email address is already in use by another account.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // secure 6-digit OTP
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    const newUser = {
      id: `u_${generateId()}`,
      username,
      password: sha256(password), // Hashed securely
      role,
      companyName: companyName || `${username}'s Freight`,
      contactName: additionalData.contactName || (username.charAt(0).toUpperCase() + username.slice(1)),
      phone: additionalData.phone || '1-800-555-0100',
      email: email,
      emailVerified: false, // Inactive until verified
      verificationOtp: otp,
      verificationExpires: otpExpires,
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      createdAt: new Date().toISOString(),
      lastLogin: ''
    };

    if (role === 'carrier') {
      newUser.mcNumber = additionalData.mcNumber || '';
      newUser.dotNumber = additionalData.dotNumber || '';
      newUser.equipmentTypes = additionalData.equipmentTypes || [];
      newUser.companyLogo = '';
    }

    data.users.push(newUser);
    save();

    // Log simulated email verification
    console.log("=== [SIMULATED EMAIL DELIVERY] ===");
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your Movana Account`);
    console.log(`Verification Code: ${otp}`);
    console.log("====================================");

    return newUser;
  },

  loginUser: (username, password) => {
    load();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error('Invalid username or password.');
    }

    // Verify hashed password
    const hashed = sha256(password);
    if (user.password !== hashed) {
      throw new Error('Invalid username or password.');
    }

    // Check if verified
    if (user.emailVerified === false) {
      // Regenerate OTP and send
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOtp = otp;
      user.verificationExpires = Date.now() + 5 * 60 * 1000;
      save();

      console.log("=== [SIMULATED EMAIL DELIVERY (LOGIN UNVERIFIED)] ===");
      console.log(`To: ${user.email}`);
      console.log(`Subject: Verify your Movana Account`);
      console.log(`Verification Code: ${otp}`);
      console.log("======================================================");

      throw new Error('UNVERIFIED_EMAIL:' + user.username);
    }

    user.lastLogin = new Date().toISOString();
    data.currentUser = user;
    save();
    return maskUser(user, user);
  },

  verifyUserEmail: (username, otp) => {
    load();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error('User not found.');
    }
    if (user.verificationOtp !== otp) {
      throw new Error('Invalid OTP. Please check the code.');
    }
    if (Date.now() > user.verificationExpires) {
      throw new Error('OTP has expired. Please click Resend.');
    }

    user.emailVerified = true;
    user.verificationOtp = '';
    user.verificationExpires = 0;
    user.lastLogin = new Date().toISOString();
    
    // Automatically log in
    data.currentUser = user;
    
    save();
    
    // Log audit
    Store.addActivityLog(user.id, 'email_verified', 'Account email verified successfully during registration.');
    
    return maskUser(user, user);
  },

  resendVerificationOtp: (username) => {
    load();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error('User not found.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = otp;
    user.verificationExpires = Date.now() + 5 * 60 * 1000;
    save();

    console.log("=== [SIMULATED EMAIL DELIVERY (RESEND)] ===");
    console.log(`To: ${user.email}`);
    console.log(`Subject: Verify your Movana Account`);
    console.log(`Verification Code: ${otp}`);
    console.log("===========================================");

    return true;
  },

  updateUserProfile: (userId, profileData) => {
    load();
    const user = data.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const changes = [];
    const logChange = (field, oldVal, newVal) => {
      if (oldVal !== newVal) {
        changes.push(`${field}: "${oldVal || ''}" -> "${newVal || ''}"`);
      }
    };

    logChange('Contact Name', user.contactName, profileData.contactName);
    logChange('Company Name', user.companyName, profileData.companyName);
    logChange('Address', user.address, profileData.address);
    logChange('City', user.city, profileData.city);
    logChange('State', user.state, profileData.state);
    logChange('Zip', user.zip, profileData.zip);
    logChange('Country', user.country, profileData.country);

    if (user.role === 'carrier') {
      logChange('MC Number', user.mcNumber, profileData.mcNumber);
      logChange('DOT Number', user.dotNumber, profileData.dotNumber);
      const oldEquip = (user.equipmentTypes || []).sort().join(',');
      const newEquip = (profileData.equipmentTypes || []).sort().join(',');
      if (oldEquip !== newEquip) {
        changes.push(`Equipment Types: [${oldEquip}] -> [${newEquip}]`);
      }
      user.mcNumber = profileData.mcNumber || '';
      user.dotNumber = profileData.dotNumber || '';
      user.equipmentTypes = profileData.equipmentTypes || [];
      if (profileData.companyLogo !== undefined) {
        user.companyLogo = profileData.companyLogo;
      }
    }

    user.contactName = profileData.contactName || '';
    user.companyName = profileData.companyName || '';
    user.address = profileData.address || '';
    user.city = profileData.city || '';
    user.state = profileData.state || '';
    user.zip = profileData.zip || '';
    user.country = profileData.country || 'United States';
    if (profileData.profilePic !== undefined) {
      user.profilePic = profileData.profilePic;
    }

    if (data.currentUser.id === user.id) {
      data.currentUser = user;
    }
    save();

    if (changes.length > 0) {
      Store.addActivityLog(user.id, 'profile_update', `Updated profile fields: ${changes.join(', ')}`);
    }

    return maskUser(user, user);
  },

  updateUserSensitiveField: (userId, field, value) => {
    load();
    const user = data.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }

    let details = '';
    if (field === 'email') {
      const duplicate = data.users.find(u => u.id !== userId && u.email && u.email.toLowerCase() === value.toLowerCase());
      if (duplicate) {
        throw new Error('Email address is already in use by another account.');
      }
      details = `Email: "${user.email}" -> "${value}"`;
      user.email = value;
    } else if (field === 'phone') {
      details = `Phone: "${user.phone}" -> "${value}"`;
      user.phone = value;
    } else if (field === 'password') {
      details = `Password changed securely`;
      user.password = sha256(value);
    }

    if (data.currentUser.id === user.id) {
      data.currentUser = user;
    }
    save();

    Store.addActivityLog(user.id, 'security_update', details);
    return maskUser(user, user);
  },

  addActivityLog: (userId, action, details) => {
    load();
    if (!data.activityLogs) data.activityLogs = [];
    
    const log = {
      id: `log_${generateId()}`,
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    data.activityLogs.push(log);
    save();
    return log;
  },

  getActivityLogs: (userId) => {
    load();
    if (!data.activityLogs) return [];
    return data.activityLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  getCurrentUser: () => {
    load();
    return maskUser(data.currentUser, data.currentUser);
  },

  setCurrentUser: (user) => {
    load();
    data.currentUser = user;
    save();
  },

  logout: () => {
    load();
    data.currentUser = null;
    save();
  },

  // Shipments
  getShipments: () => {
    load();
    const currentUser = data.currentUser;
    return data.shipments.map(s => maskShipment(s, currentUser));
  },

  getShipment: (id) => {
    load();
    const currentUser = data.currentUser;
    const shipment = data.shipments.find(s => s.id === id);
    return maskShipment(shipment, currentUser);
  },

  createShipment: (shipperId, shipperName, shipmentData) => {
    load();
    const newShipment = {
      id: `ship_${generateId()}`,
      shipperId,
      shipperName,
      origin: shipmentData.origin,
      destination: shipmentData.destination,
      cargoType: shipmentData.cargoType,
      weight: parseFloat(shipmentData.weight),
      dimensions: shipmentData.dimensions,
      pickupDate: shipmentData.pickupDate,
      deliveryDate: shipmentData.deliveryDate || '',
      budget: parseFloat(shipmentData.budget),
      description: shipmentData.description,
      status: 'open',
      carrierId: null,
      carrierName: null,
      createdAt: new Date().toISOString(),
      
      // Store full street address fields
      originStreetAddress: shipmentData.originStreetAddress || '',
      destinationStreetAddress: shipmentData.destinationStreetAddress || '',
      
      // Store coordinate/zip metadata
      originCity: shipmentData.originCity || '',
      originState: shipmentData.originState || '',
      originZip: shipmentData.originZip || '',
      originLat: shipmentData.originLat || '',
      originLon: shipmentData.originLon || '',
      destinationCity: shipmentData.destinationCity || '',
      destinationState: shipmentData.destinationState || '',
      destinationZip: shipmentData.destinationZip || '',
      destinationLat: shipmentData.destinationLat || '',
      destinationLon: shipmentData.destinationLon || '',
 
      // Store vehicle details metadata
      vehicleType: shipmentData.vehicleType || '',
      vehicleMake: shipmentData.vehicleMake || '',
      vehicleModel: shipmentData.vehicleModel || '',
      vehicleYear: shipmentData.vehicleYear || '',
      vehicleVin: shipmentData.vehicleVin || '',
      vehicleCondition: shipmentData.vehicleCondition || '',
 
      // Store photos metadata
      coverImage: shipmentData.coverImage || '',
      photoCount: parseInt(shipmentData.photoCount) || 0,

      // Store urgency priority level
      priority: shipmentData.priority || 'flexible',
      routeDistance: shipmentData.routeDistance || 0,
      routeDuration: shipmentData.routeDuration || '',

      // Store dynamic shipment types and smart form details
      shipmentType: shipmentData.shipmentType || 'Freight',
      shipmentTypeDetails: shipmentData.shipmentTypeDetails || {}
    };
    data.shipments.unshift(newShipment); // Add to top
    save();
    return newShipment;
  },

  updateShipmentStatus: (shipmentId, status, carrierId = null, carrierName = null) => {
    load();
    const shipment = data.shipments.find(s => s.id === shipmentId);
    if (!shipment) throw new Error('Shipment not found.');
    
    shipment.status = status;
    if (carrierId) {
      shipment.carrierId = carrierId;
      shipment.carrierName = carrierName;
    }
    save();
    return shipment;
  },

  // Bids
  getBids: () => {
    load();
    const currentUser = data.currentUser;
    return data.bids
      .map(b => {
        const shipment = data.shipments.find(s => s.id === b.shipmentId);
        return maskBid(b, currentUser, shipment);
      })
      .filter(Boolean);
  },

  getBidsForShipment: (shipmentId) => {
    load();
    const currentUser = data.currentUser;
    const shipment = data.shipments.find(s => s.id === shipmentId);
    return data.bids
      .filter(b => b.shipmentId === shipmentId)
      .map(b => maskBid(b, currentUser, shipment))
      .filter(Boolean);
  },

  getBidsForCarrier: (carrierId) => {
    load();
    const currentUser = data.currentUser;
    return data.bids
      .filter(b => b.carrierId === carrierId)
      .map(b => {
        const shipment = data.shipments.find(s => s.id === b.shipmentId);
        return maskBid(b, currentUser, shipment);
      })
      .filter(Boolean);
  },

  getBidCountForShipment: (shipmentId) => {
    load();
    return data.bids.filter(b => b.shipmentId === shipmentId).length;
  },

  createBid: (carrierId, carrierName, shipmentId, bidData) => {
    load();
    const shipment = data.shipments.find(s => s.id === shipmentId);
    if (!shipment || (shipment.status !== 'open' && shipment.status !== 'bidding' && shipment.status !== 'negotiating')) {
      throw new Error('This shipment is no longer open for bids.');
    }
    
    // Check if carrier already has an active bid
    const existingIndex = data.bids.findIndex(b => b.shipmentId === shipmentId && b.carrierId === carrierId);
    
    const newBid = {
      id: `bid_${generateId()}`,
      shipmentId,
      carrierId,
      carrierName,
      amount: parseFloat(bidData.amount),
      deliveryDate: bidData.deliveryDate,
      message: bidData.message || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      data.bids[existingIndex] = newBid;
    } else {
      data.bids.push(newBid);
    }
    
    // Auto-set shipment status to bidding if it was open
    if (shipment.status === 'open') {
      shipment.status = 'bidding';
    }
    
    save();
    return newBid;
  },

  acceptBid: (bidId) => {
    load();
    const bid = data.bids.find(b => b.id === bidId);
    if (!bid) throw new Error('Bid not found.');
    
    const shipment = data.shipments.find(s => s.id === bid.shipmentId);
    if (!shipment) throw new Error('Associated shipment not found.');
    
    // Accept the chosen bid
    bid.status = 'accepted';
    
    // Update shipment status and link carrier
    shipment.status = 'awarded';
    shipment.carrierId = bid.carrierId;
    shipment.carrierName = bid.carrierName;
    
    // Reject other bids for this shipment
    data.bids.forEach(b => {
      if (b.shipmentId === bid.shipmentId && b.id !== bidId) {
        b.status = 'rejected';
      }
    });
    
    save();
    return { bid, shipment };
  },

  rejectBid: (bidId) => {
    load();
    const bid = data.bids.find(b => b.id === bidId);
    if (!bid) throw new Error('Bid not found.');
    
    bid.status = 'rejected';
    save();
    return bid;
  },

  getNegotiationForBid: (bidId) => {
    load();
    if (!data.negotiations) data.negotiations = [];
    let neg = data.negotiations.find(n => n.bidId === bidId);
    if (!neg) {
      const bid = data.bids.find(b => b.id === bidId);
      if (bid) {
        neg = {
          bidId: bidId,
          messages: [
            {
              senderId: bid.carrierId,
              senderName: bid.carrierName,
              message: bid.message,
              amount: bid.amount,
              createdAt: bid.createdAt
            }
          ]
        };
        data.negotiations.push(neg);
        save();
      }
    }
    return neg;
  },

  addNegotiationMessage: (bidId, senderId, senderName, message, amount = null) => {
    load();
    if (!data.negotiations) data.negotiations = [];
    let neg = data.negotiations.find(n => n.bidId === bidId);
    if (!neg) {
      Store.getNegotiationForBid(bidId);
      neg = data.negotiations.find(n => n.bidId === bidId);
    }
    
    const newMessage = {
      senderId,
      senderName,
      message,
      amount: amount !== null ? parseFloat(amount) : null,
      createdAt: new Date().toISOString()
    };
    
    neg.messages.push(newMessage);
    
    const bid = data.bids.find(b => b.id === bidId);
    if (bid) {
      if (amount !== null) {
        bid.amount = parseFloat(amount);
        const shipment = data.shipments.find(s => s.id === bid.shipmentId);
        if (shipment) {
          shipment.status = 'negotiating';
        }
      }
    }
    
    save();
    return neg;
  },

  logViolation: (userId, text, type) => {
    load();
    if (!data.violations) data.violations = [];
    const violation = {
      id: `viol_${generateId()}`,
      userId,
      text,
      type,
      createdAt: new Date().toISOString()
    };
    data.violations.push(violation);
    save();
    return violation;
  },
  
  getViolationCount: (userId) => {
    load();
    if (!data.violations) return 0;
    return data.violations.filter(v => v.userId === userId).length;
  },

  // Reset store helper
  resetStore: () => {
    data = JSON.parse(JSON.stringify(defaultSeedData)); // Deep copy
    save();
  },

  // Photos Storage (IndexedDB Async Helpers)
  getShipmentPhotos: (shipmentId) => {
    return new Promise((resolve) => {
      const dbRequest = indexedDB.open('MovanaDB', 1);
      dbRequest.onerror = () => resolve([]);
      dbRequest.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'shipmentId' });
        }
      };
      dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        try {
          if (!db.objectStoreNames.contains('photos')) {
            // Safe fallback if database was opened elsewhere without upgrade
            resolve([]);
            return;
          }
          const transaction = db.transaction('photos', 'readonly');
          const store = transaction.objectStore('photos');
          const request = store.get(shipmentId);
          request.onsuccess = () => {
            resolve(request.result ? request.result.images : []);
          };
          request.onerror = () => resolve([]);
        } catch (err) {
          resolve([]);
        }
      };
    });
  },

  saveShipmentPhotos: (shipmentId, imagesBase64) => {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open('MovanaDB', 1);
      dbRequest.onerror = () => reject(new Error('IndexedDB open failed'));
      dbRequest.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'shipmentId' });
        }
      };
      dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        try {
          const transaction = db.transaction('photos', 'readwrite');
          const store = transaction.objectStore('photos');
          const request = store.put({ shipmentId, images: imagesBase64 });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      };
    });
  }
};

window.Store = Store;
