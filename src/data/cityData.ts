export interface Tenant {
  id: string;
  name: string;
  env: 'dev' | 'qa' | 'prod' | 'dr' | 'central';
  position: [number, number];
  resources: string[];
  components?: Component[];
}

export interface Component {
  type: string;
  description: string;
}

export interface Link {
  from: string;
  to: string;
  type: 'data' | 'sync' | 'backup';
}

// Resource to component mapping
const resourceToComponent: Record<string, Component> = {
  'load-balancer': { type: 'load-balancer', description: 'Traffic distribution and load balancing' },
  'web-server': { type: 'web-server', description: 'HTTP request handling and static content serving' },
  'app-server': { type: 'app-server', description: 'Application logic and business processing' },
  'primary-db': { type: 'primary-db', description: 'Primary database for read/write operations' },
  'replica-db': { type: 'replica-db', description: 'Database replica for read operations' },
  'cache': { type: 'cache', description: 'In-memory caching layer for performance' },
  'message-queue': { type: 'message-queue', description: 'Asynchronous message processing system' },
  'analytics': { type: 'analytics', description: 'Data analytics and reporting engine' }
};

// Available resources for random selection
const availableResources = [
  'load-balancer',
  'web-server', 
  'app-server',
  'primary-db',
  'replica-db',
  'cache',
  'message-queue',
  'analytics'
];

// Environment names for generation
const envNames = {
  prod: ['Production', 'Live', 'Main', 'Core', 'Primary'],
  dev: ['Development', 'Dev', 'Sandbox', 'Test', 'Experimental'],
  qa: ['QA', 'Staging', 'Testing', 'Validation', 'Pre-prod'],
  dr: ['Disaster Recovery', 'Backup', 'Failover', 'Recovery', 'DR']
};

function getRandomPosition(): [number, number] {
  return [
    Math.random() * 100 - 50, // x: -50 to 50
    Math.random() * 100 - 50  // z: -50 to 50
  ];
}

function getRandomResources(): string[] {
  const count = Math.floor(Math.random() * 5) + 3; // 3-7 resources
  const shuffled = [...availableResources].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateTenantName(env: 'dev' | 'qa' | 'prod' | 'dr', index: number): string {
  const prefixes = envNames[env];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffixes = ['Services', 'Cluster', 'Environment', 'System', 'Platform', 'API', 'Gateway'];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${suffix} ${index + 1}`;
}

export function generateCityData(count: number): {
  tenants: Tenant[];
  links: Link[];
} {
  const tenants: Tenant[] = [];
  const links: Link[] = [];
  
  // 1. Fixed control-plane tenant
  tenants.push({
    id: 'control-plane',
    name: 'Central Control Plane',
    env: 'central',
    position: [0, 0],
    resources: ['api-gateway', 'auth-service', 'monitoring', 'logging', 'config-manager']
  });

  // 2. Original time-portal tenant (verbatim)
  tenants.push({
    id: 'time-portal',
    name: 'Time Portal Services',
    env: 'prod',
    position: [5, 3],
    resources: ['time-api', 'temporal-db', 'sync-engine', 'cache-layer', 'scheduler', 'analytics'],
    components: [
      { type: 'time-api', description: 'REST API for time-based operations' },
      { type: 'temporal-db', description: 'High-performance temporal database' },
      { type: 'sync-engine', description: 'Real-time synchronization service' },
      { type: 'cache-layer', description: 'Redis-based caching system' },
      { type: 'scheduler', description: 'Distributed task scheduler' },
      { type: 'analytics', description: 'Time-series analytics engine' }
    ]
  });

  // 3. Generate count - 2 additional tenants
  const remainingCount = count - 2;
  
  // Distribute environments: 100 prod, 50 dev, 30 qa, 18 dr
  const envDistribution = {
    prod: Math.floor(remainingCount * 0.5), // 50% prod
    dev: Math.floor(remainingCount * 0.25), // 25% dev
    qa: Math.floor(remainingCount * 0.15),  // 15% qa
    dr: Math.floor(remainingCount * 0.1)    // 10% dr
  };

  let tenantIndex = 0;
  const envTenants: Record<string, Tenant[]> = { prod: [], dev: [], qa: [], dr: [] };

  // Generate prod tenants
  for (let i = 0; i < envDistribution.prod; i++) {
    const resources = getRandomResources();
    const tenant: Tenant = {
      id: `prod-${i + 1}`,
      name: generateTenantName('prod', i),
      env: 'prod',
      position: getRandomPosition(),
      resources,
      components: resources.map(resource => resourceToComponent[resource])
    };
    tenants.push(tenant);
    envTenants.prod.push(tenant);
    tenantIndex++;
  }

  // Generate dev tenants
  for (let i = 0; i < envDistribution.dev; i++) {
    const resources = getRandomResources();
    const tenant: Tenant = {
      id: `dev-${i + 1}`,
      name: generateTenantName('dev', i),
      env: 'dev',
      position: getRandomPosition(),
      resources,
      components: resources.map(resource => resourceToComponent[resource])
    };
    tenants.push(tenant);
    envTenants.dev.push(tenant);
    tenantIndex++;
  }

  // Generate qa tenants
  for (let i = 0; i < envDistribution.qa; i++) {
    const resources = getRandomResources();
    const tenant: Tenant = {
      id: `qa-${i + 1}`,
      name: generateTenantName('qa', i),
      env: 'qa',
      position: getRandomPosition(),
      resources,
      components: resources.map(resource => resourceToComponent[resource])
    };
    tenants.push(tenant);
    envTenants.qa.push(tenant);
    tenantIndex++;
  }

  // Generate dr tenants
  for (let i = 0; i < envDistribution.dr; i++) {
    const resources = getRandomResources();
    const tenant: Tenant = {
      id: `dr-${i + 1}`,
      name: generateTenantName('dr', i),
      env: 'dr',
      position: getRandomPosition(),
      resources,
      components: resources.map(resource => resourceToComponent[resource])
    };
    tenants.push(tenant);
    envTenants.dr.push(tenant);
    tenantIndex++;
  }

  // 4. Generate links
  const controlPlane = tenants.find(t => t.id === 'control-plane')!;
  const drTenants = envTenants.dr;

  // Data links from every tenant to control-plane
  tenants.forEach(tenant => {
    if (tenant.id !== 'control-plane') {
      links.push({
        from: tenant.id,
        to: 'control-plane',
        type: 'data'
      });
    }
  });

  // Sync link chain: dev → qa → prod → dr
  envTenants.dev.forEach(devTenant => {
    const randomQa = envTenants.qa[Math.floor(Math.random() * envTenants.qa.length)];
    if (randomQa) {
      links.push({
        from: devTenant.id,
        to: randomQa.id,
        type: 'sync'
      });
    }
  });

  envTenants.qa.forEach(qaTenant => {
    const randomProd = envTenants.prod[Math.floor(Math.random() * envTenants.prod.length)];
    if (randomProd) {
      links.push({
        from: qaTenant.id,
        to: randomProd.id,
        type: 'sync'
      });
    }
  });

  envTenants.prod.forEach(prodTenant => {
    const randomDr = drTenants[Math.floor(Math.random() * drTenants.length)];
    if (randomDr) {
      links.push({
        from: prodTenant.id,
        to: randomDr.id,
        type: 'sync'
      });
    }
  });

  // Backup links from every prod tenant to dr tenants
  envTenants.prod.forEach(prodTenant => {
    const randomDr = drTenants[Math.floor(Math.random() * drTenants.length)];
    if (randomDr) {
      links.push({
        from: prodTenant.id,
        to: randomDr.id,
        type: 'backup'
      });
    }
  });

  // Random extra data links between tenants of the same env
  Object.values(envTenants).forEach(envTenantList => {
    if (envTenantList.length > 1) {
      const extraLinks = Math.floor(Math.random() * 2) + 1; // 1-2 extra links
      for (let i = 0; i < extraLinks; i++) {
        const fromTenant = envTenantList[Math.floor(Math.random() * envTenantList.length)];
        const toTenant = envTenantList[Math.floor(Math.random() * envTenantList.length)];
        if (fromTenant && toTenant && fromTenant.id !== toTenant.id) {
          links.push({
            from: fromTenant.id,
            to: toTenant.id,
            type: 'data'
          });
        }
      }
    }
  });

  return { tenants, links };
}

export const cityData = generateCityData(200);