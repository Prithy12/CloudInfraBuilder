export interface Tenant {
  id: string;
  name: string;
  env: 'dev' | 'qa' | 'prod' | 'dr' | 'central';
  position: [number, number];
  resources: string[];
  components?: Component[];
  tier?: 'skyscraper' | 'mid-rise';
}

export interface Component {
  type: string;
  description: string;
  code?: string;
  resourceGroup?: string;
  resourceName?: string;
  displayType?: string;
}

export interface Link {
  from: string;
  to: string;
  type: 'data' | 'sync' | 'backup';
}

// Zone definitions for the city layout (original spread)
const zones = {
  prod: { x: [20, 70] as [number, number], z: [-40, 40] as [number, number] },
  dev: { x: [-70, -20] as [number, number], z: [-40, 40] as [number, number] },
  qa: { x: [-15, 15] as [number, number], z: [20, 50] as [number, number] },
  central: { x: [-10, 10] as [number, number], z: [-10, 10] as [number, number] },
  dr: { x: [80, 90] as [number, number], z: [-10, 10] as [number, number] }
};

// Resource to component mapping
const resourceToComponent: Record<string, Component> = {
  'load-balancer': { 
    type: 'load-balancer', 
    description: 'Traffic distribution and load balancing',
    code: `# Nginx Load Balancer Configuration
upstream backend {
    server 10.0.1.10:8080 weight=3;
    server 10.0.1.11:8080 weight=3;
    server 10.0.1.12:8080 weight=2;
    server 10.0.1.13:8080 weight=2;
}

server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Health checks
    location /health {
        access_log off;
        return 200 "healthy\\n";
    }
}`
  },
  'web-server': { 
    type: 'web-server', 
    description: 'HTTP request handling and static content serving',
    code: `// Express.js Web Server
const express = require('express');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Static file serving
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
  },
  'app-server': { 
    type: 'app-server', 
    description: 'Application logic and business processing',
    code: `// Node.js Application Server
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');

class AppServer {
  constructor() {
    this.app = express();
    this.redis = redis.createClient();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(cors());
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }));
  }

  setupRoutes() {
    // User management
    this.app.post('/api/users', async (req, res) => {
      const user = new User(req.body);
      await user.save();
      res.status(201).json(user);
    });

    // Business logic
    this.app.post('/api/orders', async (req, res) => {
      const order = await this.processOrder(req.body);
      await this.redis.set(\`order:\${order.id}\`, JSON.stringify(order));
      res.json(order);
    });
  }

  async processOrder(orderData) {
    // Complex business logic here
    return { id: Date.now(), ...orderData, status: 'processing' };
  }
}`
  },
  'primary-db': { 
    type: 'primary-db', 
    description: 'Primary database for read/write operations',
    code: `-- PostgreSQL Primary Database Schema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Database connection configuration
-- postgresql://user:password@primary-db:5432/app_db
-- Replication: 1 primary, 2 read replicas`
  },
  'replica-db': { 
    type: 'replica-db', 
    description: 'Database replica for read operations',
    code: `-- PostgreSQL Read Replica Configuration
-- postgresql.conf
hot_standby = on
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB

-- Recovery configuration
standby_mode = on
primary_conninfo = 'host=primary-db port=5432 user=replica password=secret'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'

-- Read-only queries only
-- No INSERT, UPDATE, DELETE operations allowed
-- Automatic failover to primary if replica goes down

-- Connection string for read replicas
-- postgresql://user:password@replica-1:5432/app_db
-- postgresql://user:password@replica-2:5432/app_db`
  },
  'cache': { 
    type: 'cache', 
    description: 'In-memory caching layer for performance',
    code: `// Redis Cache Layer
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

class CacheService {
  constructor() {
    this.client = client;
    this.defaultTTL = 3600; // 1 hour
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async invalidate(pattern) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

// Usage example
const cache = new CacheService();
const userData = await cache.get('user:123') || await fetchUserFromDB(123);`
  },
  'message-queue': { 
    type: 'message-queue', 
    description: 'Asynchronous message processing system',
    code: `// RabbitMQ Message Queue
const amqp = require('amqplib');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
    
    // Declare queues
    await this.channel.assertQueue('email_queue', { durable: true });
    await this.channel.assertQueue('order_queue', { durable: true });
    await this.channel.assertQueue('notification_queue', { durable: true });
  }

  async publishMessage(queue, message) {
    return this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      timestamp: Date.now()
    });
  }

  async consumeMessages(queue, callback) {
    await this.channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        this.channel.ack(msg);
      }
    });
  }
}

// Producer example
const queue = new MessageQueue();
await queue.connect();
await queue.publishMessage('email_queue', {
  to: 'user@example.com',
  subject: 'Order Confirmation',
  template: 'order_confirmation'
});`
  },
  'analytics': { 
    type: 'analytics', 
    description: 'Data analytics and reporting engine',
    code: `// Analytics Processing Engine
const { BigQuery } = require('@google-cloud/bigquery');
const { Dataflow } = require('@google-cloud/dataflow');

class AnalyticsEngine {
  constructor() {
    this.bigquery = new BigQuery();
    this.dataflow = new Dataflow();
  }

  async processUserEvents(events) {
    // Stream events to BigQuery
    const dataset = this.bigquery.dataset('analytics');
    const table = dataset.table('user_events');
    
    await table.insert(events.map(event => ({
      user_id: event.userId,
      event_type: event.type,
      timestamp: new Date(event.timestamp),
      properties: JSON.stringify(event.properties)
    })));
  }

  async generateReport(startDate, endDate) {
    const query = \`
      SELECT 
        DATE(timestamp) as date,
        event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM \`analytics.user_events\`
      WHERE timestamp BETWEEN @startDate AND @endDate
      GROUP BY date, event_type
      ORDER BY date DESC
    \`;

    const [rows] = await this.bigquery.query({
      query,
      params: { startDate, endDate }
    });

    return rows;
  }

  async createDataPipeline() {
    // Apache Beam pipeline for real-time processing
    const pipeline = this.dataflow.createPipeline({
      projectId: 'my-project',
      region: 'us-central1'
    });

    // Process streaming data
    pipeline
      .fromPubSub('projects/my-project/topics/user-events')
      .window(60) // 1-minute windows
      .groupBy('user_id')
      .aggregate('event_count', 'count')
      .toBigQuery('analytics.user_metrics');
  }
}`
  }
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

// Sample regions and app names for realism
const regions = ['eastus', 'westus', 'northeurope', 'westeurope', 'ap-southeast-1', 'us-central1', 'eu-west-1'];
const appNames = ['orders', 'payments', 'users', 'inventory', 'portal', 'analytics', 'api', 'web', 'core', 'sync'];

// Friendly display names for resource types
const resourceTypeLabels: Record<string, string> = {
  'load-balancer': 'Load Balancer',
  'web-server': 'Web Server',
  'app-server': 'Application Server',
  'primary-db': 'Primary Database',
  'replica-db': 'Read Replica Database',
  'cache': 'Cache Layer',
  'message-queue': 'Message Queue',
  'analytics': 'Analytics Engine',
  'time-api': 'Time API',
  'temporal-db': 'Temporal Database',
  'sync-engine': 'Sync Engine',
  'cache-layer': 'Cache Layer',
  'scheduler': 'Scheduler',
};

// Generates a random position within a given zone
function getRandomPositionInZone(zone: { x: [number, number], z: [number, number] }): [number, number] {
  const x = Math.random() * (zone.x[1] - zone.x[0]) + zone.x[0];
  const z = Math.random() * (zone.z[1] - zone.z[0]) + zone.z[0];
  return [x, z];
}

// Gets a random number of resources based on building tier
function getRandomResources(tier: 'skyscraper' | 'mid-rise'): string[] {
  const count = tier === 'skyscraper'
    ? Math.floor(Math.random() * 5) + 8  // 8-12 resources
    : Math.floor(Math.random() * 4) + 3; // 3-6 resources
    
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

// Helper to generate a resource group and resource name
function getResourceGroup(env: string, tenantId: string) {
  const region = regions[Math.floor(Math.random() * regions.length)];
  const app = appNames[Math.floor(Math.random() * appNames.length)];
  const num = String(Math.floor(Math.random() * 90) + 10); // 2-digit
  return `rg-${env}-${region}-${app}${num}`;
}
function getResourceName(env: string, tenantId: string, type: string, idx: number) {
  const region = regions[Math.floor(Math.random() * regions.length)];
  const app = appNames[Math.floor(Math.random() * appNames.length)];
  const shortType = type.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().split('-').map((w, i) => i === 0 ? w : w[0]).join('');
  const num = String(Math.floor(Math.random() * 90) + 10); // 2-digit
  return `${env}-${app}-${shortType}-${region}-${num}`;
}

// Main function to generate the entire city data
export function generateCityData(): {
  tenants: Tenant[];
  links: Link[];
} {
  const tenants: Tenant[] = [];
  const links: Link[] = [];

  const buildingCounts = {
    prod: { skyscrapers: 10, midRises: 40 },
    dev: { skyscrapers: 10, midRises: 25 },
    qa: { skyscrapers: 5, midRises: 10 },
    dr: { midRises: 2 }
  };

  // Helper to generate tenants for a specific zone
  const generateTenantsForZone = (
    env: 'dev' | 'qa' | 'prod',
    counts: { skyscrapers: number, midRises: number }
  ) => {
    // Generate skyscrapers
    for (let i = 0; i < counts.skyscrapers; i++) {
      const resources = getRandomResources('skyscraper');
      const tempId = `${env}-skyscraper-${i + 1}`;
      const tenant: Tenant = {
        id: tempId,
        name: `${env.toUpperCase()} Skyscraper ${i + 1}`,
        env,
        position: getRandomPositionInZone(zones[env]),
        resources,
        components: resources.map((res, idx) => ({
          ...resourceToComponent[res],
          displayType: resourceTypeLabels[res] || res,
          resourceGroup: getResourceGroup(env, tempId + '-' + idx),
          resourceName: getResourceName(env, tempId, res, idx)
        })),
        tier: 'skyscraper'
      };
      tenants.push(tenant);
    }
    // Generate mid-rises
    for (let i = 0; i < counts.midRises; i++) {
      const resources = getRandomResources('mid-rise');
      const tempId = `${env}-midrise-${i + 1}`;
      const tenant: Tenant = {
        id: tempId,
        name: `${env.toUpperCase()} Building ${i + 1}`,
        env,
        position: getRandomPositionInZone(zones[env]),
        resources,
        components: resources.map((res, idx) => ({
          ...resourceToComponent[res],
          displayType: resourceTypeLabels[res] || res,
          resourceGroup: getResourceGroup(env, tempId + '-' + idx),
          resourceName: getResourceName(env, tempId, res, idx)
        })),
        tier: 'mid-rise'
      };
      tenants.push(tenant);
    }
  };

  // Generate tenants for each main zone
  generateTenantsForZone('prod', buildingCounts.prod);
  generateTenantsForZone('dev', buildingCounts.dev);
  generateTenantsForZone('qa', buildingCounts.qa);

  // -- Static & Control Plane Tenants --

  // 1. Central Control Plane
  tenants.push({
    id: 'control-plane',
    name: 'Central Control Plane',
    env: 'central',
    position: [0, 0],
    resources: ['api-gateway', 'auth-service', 'monitoring', 'logging', 'config-manager']
  });

  // 2. Clickable "Time Portal" App (in prod zone), ensure it's not too close to control-plane or any other building
  function getFarPosition(zone: { x: [number, number], z: [number, number] }, minDist: number, others: [number, number][]): [number, number] {
    let pos: [number, number];
    let attempts = 0;
    do {
      pos = getRandomPositionInZone(zone);
      attempts++;
    } while (
      others.some((o: [number, number]) => Math.hypot(pos[0] - o[0], pos[1] - o[1]) < minDist) && attempts < 100
    );
    return pos;
  }
  const minDistance = 15;
  const otherPositions = tenants.map(t => t.position);
  const timePortalPos = getFarPosition(zones.prod, minDistance, otherPositions);

  tenants.push({
    id: 'time-portal',
    name: 'Time Portal Services',
    env: 'prod',
    position: timePortalPos,
    resources: ['time-api', 'temporal-db', 'sync-engine', 'cache-layer', 'scheduler', 'analytics'],
    components: [
      { ...resourceToComponent['time-api'], displayType: resourceTypeLabels['time-api'], resourceGroup: getResourceGroup('prod', 'time-portal-0'), resourceName: getResourceName('prod', 'time-portal', 'time-api', 0) },
      { ...resourceToComponent['temporal-db'], displayType: resourceTypeLabels['temporal-db'], resourceGroup: getResourceGroup('prod', 'time-portal-1'), resourceName: getResourceName('prod', 'time-portal', 'temporal-db', 1) },
      { ...resourceToComponent['sync-engine'], displayType: resourceTypeLabels['sync-engine'], resourceGroup: getResourceGroup('prod', 'time-portal-2'), resourceName: getResourceName('prod', 'time-portal', 'sync-engine', 2) },
      { ...resourceToComponent['cache-layer'], displayType: resourceTypeLabels['cache-layer'], resourceGroup: getResourceGroup('prod', 'time-portal-3'), resourceName: getResourceName('prod', 'time-portal', 'cache-layer', 3) },
      { ...resourceToComponent['scheduler'], displayType: resourceTypeLabels['scheduler'], resourceGroup: getResourceGroup('prod', 'time-portal-4'), resourceName: getResourceName('prod', 'time-portal', 'scheduler', 4) },
      { ...resourceToComponent['analytics'], displayType: resourceTypeLabels['analytics'], resourceGroup: getResourceGroup('prod', 'time-portal-5'), resourceName: getResourceName('prod', 'time-portal', 'analytics', 5) }
    ],
    tier: 'skyscraper'
  });

  // 3. Disaster Recovery Site
  for (let i = 0; i < buildingCounts.dr.midRises; i++) {
    const resources = getRandomResources('mid-rise');
    tenants.push({
      id: `dr-site-${i + 1}`,
      name: `DR Site ${i + 1}`,
      env: 'dr',
      position: getRandomPositionInZone(zones.dr),
      resources,
      components: resources.map((res, idx) => ({
        ...resourceToComponent[res],
        displayType: resourceTypeLabels[res] || res,
        resourceGroup: getResourceGroup('dr', `dr-site-${i + 1}-${idx}`),
        resourceName: getResourceName('dr', `dr-site-${i + 1}`, res, idx)
      })),
      tier: 'mid-rise'
    });
  }

  // --- Link Generation ---
  
  // Connect all tenants to the control plane
  tenants.forEach(tenant => {
    if (tenant.id !== 'control-plane') {
      links.push({ from: tenant.id, to: 'control-plane', type: 'data' });
    }
  });

  // Connect dev tenants to qa tenants
  const devTenants = tenants.filter(t => t.env === 'dev');
  const qaTenants = tenants.filter(t => t.env === 'qa');
  devTenants.forEach(dev => {
    if (qaTenants.length > 0) {
      const target = qaTenants[Math.floor(Math.random() * qaTenants.length)];
      links.push({ from: dev.id, to: target.id, type: 'sync' });
    }
  });

  // Connect qa tenants to prod tenants
  const prodTenants = tenants.filter(t => t.env === 'prod');
  qaTenants.forEach(qa => {
    if (prodTenants.length > 0) {
      const target = prodTenants[Math.floor(Math.random() * prodTenants.length)];
      links.push({ from: qa.id, to: target.id, type: 'sync' });
    }
  });
  
  // Connect prod tenants to dr tenants for backup
  const drTenants = tenants.filter(t => t.env === 'dr');
  prodTenants.forEach(prod => {
    if (drTenants.length > 0) {
      const target = drTenants[Math.floor(Math.random() * drTenants.length)];
      links.push({ from: prod.id, to: target.id, type: 'backup' });
    }
  });

  return { tenants, links };
}

export const cityData = generateCityData();