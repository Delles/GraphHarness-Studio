import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import neo4j from 'neo4j-driver'; // This will be the mocked version
import * as graphService from './graph-service';
import {
  CreateWireInputSchema,
  UpdateWireInputSchema,
  ConnectorPropertiesSchema,
  CreateConnectorInputSchema,
  UpdateConnectorInputSchema,
  CavityPropertiesSchema,
  CreateCavityInputSchema,
  UpdateCavityInputSchema,
  SplicePropertiesSchema,
  CreateSpliceInputSchema,
  UpdateSpliceInputSchema,
  TerminationPropertiesSchema,
  JoinPropertiesSchema
} from './graph-service'; // Import Zod schemas

// Mock the neo4j-driver
const mockSessionRun = vi.fn();
const mockSessionClose = vi.fn(() => Promise.resolve());
const mockDriverClose = vi.fn(() => Promise.resolve());
const mockVerifyConnectivity = vi.fn(() => Promise.resolve({}));

vi.mock('neo4j-driver', () => {
  const mockSession = {
    run: mockSessionRun,
    close: mockSessionClose,
    lastBookmark: vi.fn(() => null), // or lastBookmarks()
    beginTransaction: vi.fn(), // if you use transactions explicitly
  };
  const mockDriverInstance = {
    session: vi.fn(() => mockSession),
    close: mockDriverClose,
    verifyConnectivity: mockVerifyConnectivity,
  };
  return {
    driver: vi.fn(() => mockDriverInstance),
    auth: {
      basic: vi.fn(),
    },
    isNeo4jError: vi.fn((e) => e instanceof Error && (e.name === 'Neo4jError' || e.message.includes('Neo4j'))),
    // Add any other named exports if your service uses them (e.g., specific error types)
  };
});


describe('Graph Service', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test

    // Reset an internal state of graphService if getDriver caches the driver.
    // This ensures that getDriver uses the fresh mock for each test.
    graphService.closeDriver(); // Effectively resets the internal driver instance in graph-service

    // Default mock for session.run to return something sensible
    mockSessionRun.mockResolvedValue({
      records: [],
      summary: {
        counters: {
          nodesCreated: () => 0,
          nodesDeleted: () => 0,
          relationshipsCreated: () => 0,
          relationshipsDeleted: () => 0,
          propertiesSet: () => 0,
        } as any, // Use 'as any' to simplify mock summary for non-critical parts
      },
    });
  });

  afterEach(async () => {
    await graphService.closeDriver(); // Ensure driver is closed after each test
  });

  describe('Driver Management', () => {
    it('getDriver should initialize and return a driver instance', async () => {
      const driverInstance = graphService.getDriver();
      expect(neo4j.driver).toHaveBeenCalledTimes(1);
      expect(driverInstance).toBeDefined();
      await driverInstance.verifyConnectivity(); // from graph-service's getDriver
      expect(mockVerifyConnectivity).toHaveBeenCalledTimes(1);
    });

    it('closeDriver should close the driver if initialized', async () => {
      graphService.getDriver(); // Initialize driver
      await graphService.closeDriver();
      expect(mockDriverClose).toHaveBeenCalledTimes(1);
    });

     it('closeDriver should not throw if driver is not initialized', async () => {
      await expect(graphService.closeDriver()).resolves.not.toThrow();
      expect(mockDriverClose).not.toHaveBeenCalled();
    });
  });

  describe('Zod Schema Validations', () => {
    describe('Wire Schemas', () => {
      it('CreateWireInputSchema: valid data', () => {
        const data = { wireId: 'W001', crossSectionalArea: 0.75, length: 100 };
        expect(() => CreateWireInputSchema.parse(data)).not.toThrow();
      });
      it('CreateWireInputSchema: invalid data (missing required)', () => {
        const data = { wireId: 'W001' }; // Missing cSA, length
        expect(() => CreateWireInputSchema.parse(data)).toThrow();
      });
      it('UpdateWireInputSchema: valid data (partial)', () => {
        const data = { name: 'New Name' };
        expect(() => UpdateWireInputSchema.parse(data)).not.toThrow();
      });
      it('UpdateWireInputSchema: invalid data (empty)', () => {
        const data = {};
        expect(() => UpdateWireInputSchema.parse(data)).toThrow("At least one property must be provided for update");
      });
    });
    // Add similar Zod schema tests for Connector, Cavity, Splice, and Relationships
    describe('Connector Schemas', () => {
        it('CreateConnectorInputSchema: valid data', () => {
            const data = { connectorId: "C001", name: "Test Connector" };
            expect(() => CreateConnectorInputSchema.parse(data)).not.toThrow();
        });
        it('CreateConnectorInputSchema: invalid data (missing connectorId)', () => {
            const data = { name: "Test Connector" };
            expect(() => CreateConnectorInputSchema.parse(data)).toThrow();
        });
         it('UpdateConnectorInputSchema: valid data (partial)', () => {
            const data = { name: "New Connector Name" };
            expect(() => UpdateConnectorInputSchema.parse(data)).not.toThrow();
        });
        it('UpdateConnectorInputSchema: invalid data (empty)', () => {
            const data = {};
            expect(() => UpdateConnectorInputSchema.parse(data)).toThrow("At least one property must be provided for update");
        });
    });
  });

  describe('createIndexes', () => {
    it('should call session.run for each index creation', async () => {
      await graphService.createIndexes();
      expect(mockSessionRun).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX wire_wireId_idx IF NOT EXISTS FOR (w:Wire) ON (w.wireId)'));
      expect(mockSessionRun).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX wire_optionCode_idx IF NOT EXISTS FOR (w:Wire) ON (w.optionCode)'));
      expect(mockSessionRun).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX connector_connectorId_idx IF NOT EXISTS FOR (c:Connector) ON (c.connectorId)'));
      expect(mockSessionRun).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX cavity_cavityId_idx IF NOT EXISTS FOR (cv:Cavity) ON (cv.cavityId)'));
      expect(mockSessionRun).toHaveBeenCalledWith(expect.stringContaining('CREATE INDEX splice_spliceId_idx IF NOT EXISTS FOR (s:Splice) ON (s.spliceId)'));
      expect(mockSessionRun).toHaveBeenCalledTimes(5); // Ensure all index queries were run
      expect(mockSessionClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Wire CRUD Operations', () => {
    const wireData = { wireId: 'W001', crossSectionalArea: 0.5, length: 100, name: 'TestWire' };
    const mockWireRecord = { properties: wireData };

    it('createWire: successful creation', async () => {
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => mockWireRecord }] } as any);
      const result = await graphService.createWire(wireData);
      expect(mockSessionRun).toHaveBeenCalledWith('CREATE (w:Wire $props) RETURN w', { props: wireData });
      expect(result).toEqual(wireData);
    });

    it('createWire: validation failure', async () => {
      const invalidData = { wireId: 'W002' } as any; // Missing required fields
      await expect(graphService.createWire(invalidData)).rejects.toThrow(/Invalid input for creating wire/);
      expect(mockSessionRun).not.toHaveBeenCalled();
    });

    it('getWireById: successful retrieval', async () => {
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => mockWireRecord }] } as any);
      const result = await graphService.getWireById('W001');
      expect(mockSessionRun).toHaveBeenCalledWith('MATCH (w:Wire {wireId: $wireId}) RETURN w', { wireId: 'W001' });
      expect(result).toEqual(wireData);
    });

    it('getWireById: not found', async () => {
      mockSessionRun.mockResolvedValueOnce({ records: [] } as any);
      const result = await graphService.getWireById('W_NOT_FOUND');
      expect(result).toBeNull();
    });

    it('updateWire: successful update', async () => {
        const updatePayload = { name: "Updated Wire Name" };
        const updatedWireData = { ...wireData, ...updatePayload };
        mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => ({ properties: updatedWireData }) }] } as any);

        const result = await graphService.updateWire('W001', updatePayload);
        expect(mockSessionRun).toHaveBeenCalledWith('MATCH (w:Wire {wireId: $wireId}) SET w += $props RETURN w', { wireId: 'W001', props: updatePayload });
        expect(result).toEqual(updatedWireData);
    });

    it('updateWire: validation failure for payload', async () => {
        const invalidUpdatePayload = { length: -100 }; // Invalid value
        await expect(graphService.updateWire('W001', invalidUpdatePayload)).rejects.toThrow(/Invalid input for updating wire/);
        expect(mockSessionRun).not.toHaveBeenCalled();
    });

    it('deleteWire: successful deletion', async () => {
        mockSessionRun.mockResolvedValueOnce({ summary: { counters: { nodesDeleted: () => 1 } } } as any);
        const result = await graphService.deleteWire('W001');
        expect(mockSessionRun).toHaveBeenCalledWith('MATCH (w:Wire {wireId: $wireId}) DETACH DELETE w', { wireId: 'W001' });
        expect(result).toBe(true);
    });

    it('deleteWire: wire not found', async () => {
        mockSessionRun.mockResolvedValueOnce({ summary: { counters: { nodesDeleted: () => 0 } } } as any);
        const result = await graphService.deleteWire('W_NOT_FOUND');
        expect(result).toBe(false);
    });
  });

  // Placeholder for Connector, Cavity, Splice CRUD tests (similar structure to Wire)
  describe('Connector CRUD Operations', () => {
    const connectorData = { connectorId: 'C001', name: 'Test Connector' };
    const mockConnectorRecord = { properties: connectorData };

    it('createConnector: successful creation', async () => {
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => mockConnectorRecord }] }as any);
      const result = await graphService.createConnector(connectorData);
      expect(mockSessionRun).toHaveBeenCalledWith('CREATE (c:Connector $props) RETURN c', { props: connectorData });
      expect(result).toEqual(connectorData);
    });
    // ... more Connector tests (get, update, delete, validation)
  });

  describe('Cavity CRUD Operations', () => {
    const cavityData = { cavityId: 'Cav001', cavityNumber: "1", connectorId: "C001" };
    const mockCavityRecord = { properties: cavityData };

    it('createCavity: successful creation', async () => {
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => mockCavityRecord }] }as any);
      const result = await graphService.createCavity(cavityData);
      expect(mockSessionRun).toHaveBeenCalledWith('CREATE (cv:Cavity $props) RETURN cv', { props: cavityData });
      expect(result).toEqual(cavityData);
    });
    // ... more Cavity tests
  });

  describe('Splice CRUD Operations', () => {
    const spliceData = { spliceId: 'S001', type: 'Test Splice' };
    const mockSpliceRecord = { properties: spliceData };

    it('createSplice: successful creation', async () => {
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => mockSpliceRecord }] }as any);
      const result = await graphService.createSplice(spliceData);
      expect(mockSessionRun).toHaveBeenCalledWith('CREATE (s:Splice $props) RETURN s', { props: spliceData });
      expect(result).toEqual(spliceData);
    });
    // ... more Splice tests
  });


  describe('Relationship Management', () => {
    const wireId = 'W001';
    const cavityId = 'Cav001';
    const connectorId = 'C001';
    const spliceId = 'S001';

    it('addWireToCavity: successful', async () => {
      const props = { terminationType: 'Crimp' };
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => ({ properties: props }) }] } as any);
      const result = await graphService.addWireToCavity(wireId, cavityId, props);
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (w:Wire {wireId: $wireId})'), // Using stringContaining for complex queries
        { wireId, cavityId, props }
      );
      expect(result).toEqual(props);
    });

    it('addWireToCavity: validation failure for properties', async () => {
        const invalidProps = { terminationType: 123 }; // Invalid type
        await expect(graphService.addWireToCavity(wireId, cavityId, invalidProps as any)).rejects.toThrow(/Invalid termination properties/);
        expect(mockSessionRun).not.toHaveBeenCalled();
    });

    it('addCavityToConnector: successful', async () => {
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => ({ properties: {} }) }] } as any); // Assuming no props on HAS_CAVITY
      await graphService.addCavityToConnector(cavityId, connectorId);
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (conn:Connector {connectorId: $connectorId})'),
        { cavityId, connectorId }
      );
    });

    it('addWireToSplice: successful', async () => {
      const props = { details: 'Test detail' };
      mockSessionRun.mockResolvedValueOnce({ records: [{ get: () => ({ properties: props }) }] } as any);
      const result = await graphService.addWireToSplice(wireId, spliceId, props);
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (w:Wire {wireId: $wireId})'),
        { wireId, spliceId, props }
      );
      expect(result).toEqual(props);
    });
  });
});
