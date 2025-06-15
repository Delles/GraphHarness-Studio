import neo4j, {
  Driver,
  Session,
  QueryResult,
  Record as Neo4jRecord,
} from 'neo4j-driver';
import { z } from 'zod';

// Neo4j Driver Initialization
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    try {
      driver = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
      );
      // Verify connectivity
      driver
        .verifyConnectivity()
        .then(() => console.log('Neo4j Driver connected successfully.'))
        .catch((error) => {
          console.error('Neo4j Driver connection verification failed:', error);
          // Potentially stop the app or retry, for now just log
          driver = null; // Reset driver if connection failed
        });
    } catch (error) {
      console.error('Failed to create Neo4j driver:', error);
      throw new Error('Could not initialize Neo4j driver.');
    }
  }
  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j Driver connection closed.');
  }
}

// Zod Schemas for Wire
export const WirePropertiesSchema = z.object({
  wireId: z.string().min(1, 'wireId cannot be empty'),
  name: z.string().optional(),
  crossSectionalArea: z
    .number()
    .positive('crossSectionalArea must be a positive number'),
  color: z.string().optional(),
  material: z.string().optional(),
  length: z.number().positive('length must be a positive number'),
  insulationMaterial: z.string().optional(),
  optionCode: z.string().optional(),
});
export type WireProperties = z.infer<typeof WirePropertiesSchema>;

export const CreateWireInputSchema = WirePropertiesSchema.pick({
  wireId: true,
  crossSectionalArea: true,
  length: true,
}).merge(
  WirePropertiesSchema.partial().omit({
    wireId: true,
    crossSectionalArea: true,
    length: true,
  })
);
export type CreateWireInput = z.infer<typeof CreateWireInputSchema>;

export const UpdateWireInputSchema = WirePropertiesSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one property must be provided for update'
);
export type UpdateWireInput = z.infer<typeof UpdateWireInputSchema>;

// Zod Schemas for Connector
export const ConnectorPropertiesSchema = z.object({
  connectorId: z.string().min(1, 'connectorId cannot be empty'),
  name: z.string().optional(),
  type: z.string().optional(),
  partNumber: z.string().optional(),
  manufacturer: z.string().optional(),
});
export type ConnectorProperties = z.infer<typeof ConnectorPropertiesSchema>;

export const CreateConnectorInputSchema = ConnectorPropertiesSchema;
export type CreateConnectorInput = z.infer<typeof CreateConnectorInputSchema>;

export const UpdateConnectorInputSchema =
  ConnectorPropertiesSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    'At least one property must be provided for update'
  );
export type UpdateConnectorInput = z.infer<typeof UpdateConnectorInputSchema>;

// Zod Schemas for Cavity
export const CavityPropertiesSchema = z.object({
  cavityId: z.string().min(1, 'cavityId cannot be empty'),
  cavityNumber: z.string().min(1, 'cavityNumber cannot be empty'),
  connectorId: z
    .string()
    .min(1, 'connectorId is required to link to a Connector'), // Foreign key
  material: z.string().optional(),
  shape: z.string().optional(),
});
export type CavityProperties = z.infer<typeof CavityPropertiesSchema>;

export const CreateCavityInputSchema = CavityPropertiesSchema;
export type CreateCavityInput = z.infer<typeof CreateCavityInputSchema>;

export const UpdateCavityInputSchema = CavityPropertiesSchema.partial()
  .omit({ connectorId: true })
  .refine(
    // connectorId typically shouldn't be updated via this
    (data) => Object.keys(data).length > 0,
    'At least one property must be provided for update'
  );
export type UpdateCavityInput = z.infer<typeof UpdateCavityInputSchema>;

// Zod Schemas for Splice
export const SplicePropertiesSchema = z.object({
  spliceId: z.string().min(1, 'spliceId cannot be empty'),
  type: z.string().optional(),
  location: z.string().optional(),
});
export type SpliceProperties = z.infer<typeof SplicePropertiesSchema>;

export const CreateSpliceInputSchema = SplicePropertiesSchema;
export type CreateSpliceInput = z.infer<typeof CreateSpliceInputSchema>;

export const UpdateSpliceInputSchema = SplicePropertiesSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one property must be provided for update'
);
export type UpdateSpliceInput = z.infer<typeof UpdateSpliceInputSchema>;

// Zod Schemas for Relationships
export const TerminationPropertiesSchema = z.object({
  terminationType: z.string().optional(),
  seal: z.string().optional(),
});
export type TerminationProperties = z.infer<typeof TerminationPropertiesSchema>;

export const JoinPropertiesSchema = z.object({
  details: z.string().optional(),
});
export type JoinProperties = z.infer<typeof JoinPropertiesSchema>;

// Index Creation Function
export async function createIndexes(): Promise<void> {
  const currentDriver = getDriver();
  if (!currentDriver) {
    console.error('Driver not available for creating indexes.');
    throw new Error('Neo4j driver not initialized.');
  }
  const session: Session = currentDriver.session();
  try {
    console.log('Creating indexes...');
    // Wire indexes
    await session.run(
      'CREATE INDEX wire_wireId_idx IF NOT EXISTS FOR (w:Wire) ON (w.wireId)'
    );
    await session.run(
      'CREATE INDEX wire_optionCode_idx IF NOT EXISTS FOR (w:Wire) ON (w.optionCode)'
    );
    // Connector indexes
    await session.run(
      'CREATE INDEX connector_connectorId_idx IF NOT EXISTS FOR (c:Connector) ON (c.connectorId)'
    );
    // Cavity indexes
    await session.run(
      'CREATE INDEX cavity_cavityId_idx IF NOT EXISTS FOR (cv:Cavity) ON (cv.cavityId)'
    );
    // Splice indexes
    await session.run(
      'CREATE INDEX splice_spliceId_idx IF NOT EXISTS FOR (s:Splice) ON (s.spliceId)'
    );
    console.log('Indexes created successfully (or already existed).');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw new Error('Failed to create Neo4j indexes.');
  } finally {
    await session.close();
  }
}

// Helper to extract properties from Neo4j Record
function extractNodeProperties<T>(
  record: Neo4jRecord | undefined,
  key: string
): T | null {
  return record?.get(key)?.properties as T | null;
}

function extractRelationshipProperties<T>(
  record: Neo4jRecord | undefined,
  key: string
): T | null {
  return record?.get(key)?.properties as T | null;
}

// CRUD Operations for Wire
export async function createWire(
  data: CreateWireInput
): Promise<WireProperties | null> {
  try {
    const validatedData = CreateWireInputSchema.parse(data);
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');

    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        'CREATE (w:Wire $props) RETURN w',
        { props: validatedData }
      );
      return extractNodeProperties<WireProperties>(result.records[0], 'w');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating wire:', error.errors);
      throw new Error(
        `Invalid input for creating wire: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error('Error creating wire:', error);
    throw new Error('Failed to create wire in Neo4j.');
  }
}

export async function getWireById(
  wireId: string
): Promise<WireProperties | null> {
  if (!wireId || typeof wireId !== 'string' || wireId.trim() === '') {
    throw new Error('Invalid wireId provided.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');

  const session: Session = currentDriver.session();
  try {
    const result: QueryResult = await session.run(
      'MATCH (w:Wire {wireId: $wireId}) RETURN w',
      { wireId }
    );
    if (result.records.length === 0) {
      return null;
    }
    return extractNodeProperties<WireProperties>(result.records[0], 'w');
  } catch (error) {
    console.error(`Error getting wire by ID (${wireId}):`, error);
    throw new Error(`Failed to retrieve wire ${wireId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

export async function updateWire(
  wireId: string,
  data: UpdateWireInput
): Promise<WireProperties | null> {
  if (!wireId || typeof wireId !== 'string' || wireId.trim() === '') {
    throw new Error('Invalid wireId provided for update.');
  }
  try {
    const validatedData = UpdateWireInputSchema.parse(data);
    if (Object.keys(validatedData).length === 0) {
      throw new Error('No properties provided to update for wire.');
    }

    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');

    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        'MATCH (w:Wire {wireId: $wireId}) SET w += $props RETURN w',
        { wireId, props: validatedData }
      );
      if (result.records.length === 0) {
        return null;
      }
      return extractNodeProperties<WireProperties>(result.records[0], 'w');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `Validation error updating wire (${wireId}):`,
        error.errors
      );
      throw new Error(
        `Invalid input for updating wire ${wireId}: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error(`Error updating wire (${wireId}):`, error);
    throw new Error(`Failed to update wire ${wireId} in Neo4j.`);
  }
}

export async function deleteWire(wireId: string): Promise<boolean> {
  if (!wireId || typeof wireId !== 'string' || wireId.trim() === '') {
    throw new Error('Invalid wireId provided for deletion.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');

  const session: Session = currentDriver.session();
  try {
    const result: QueryResult = await session.run(
      'MATCH (w:Wire {wireId: $wireId}) DETACH DELETE w',
      { wireId }
    );
    if (result.summary.counters.updates().nodesDeleted === 0) {
      console.warn(`Attempted to delete wire ${wireId}, but it was not found.`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error deleting wire (${wireId}):`, error);
    throw new Error(`Failed to delete wire ${wireId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

// CRUD Operations for Connector
export async function createConnector(
  data: CreateConnectorInput
): Promise<ConnectorProperties | null> {
  try {
    const validatedData = CreateConnectorInputSchema.parse(data);
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        'CREATE (c:Connector $props) RETURN c',
        { props: validatedData }
      );
      return extractNodeProperties<ConnectorProperties>(result.records[0], 'c');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating connector:', error.errors);
      throw new Error(
        `Invalid input for creating connector: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error('Error creating connector:', error);
    throw new Error('Failed to create connector in Neo4j.');
  }
}

export async function getConnectorById(
  connectorId: string
): Promise<ConnectorProperties | null> {
  if (
    !connectorId ||
    typeof connectorId !== 'string' ||
    connectorId.trim() === ''
  ) {
    throw new Error('Invalid connectorId provided.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');
  const session: Session = currentDriver.session();
  try {
    const result: QueryResult = await session.run(
      'MATCH (c:Connector {connectorId: $connectorId}) RETURN c',
      { connectorId }
    );
    if (result.records.length === 0) return null;
    return extractNodeProperties<ConnectorProperties>(result.records[0], 'c');
  } catch (error) {
    console.error(`Error getting connector by ID (${connectorId}):`, error);
    throw new Error(`Failed to retrieve connector ${connectorId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

export async function updateConnector(
  connectorId: string,
  data: UpdateConnectorInput
): Promise<ConnectorProperties | null> {
  if (
    !connectorId ||
    typeof connectorId !== 'string' ||
    connectorId.trim() === ''
  ) {
    throw new Error('Invalid connectorId provided for update.');
  }
  try {
    const validatedData = UpdateConnectorInputSchema.parse(data);
    if (Object.keys(validatedData).length === 0) {
      throw new Error('No properties provided to update for connector.');
    }
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        'MATCH (c:Connector {connectorId: $connectorId}) SET c += $props RETURN c',
        { connectorId, props: validatedData }
      );
      if (result.records.length === 0) return null;
      return extractNodeProperties<ConnectorProperties>(result.records[0], 'c');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `Validation error updating connector (${connectorId}):`,
        error.errors
      );
      throw new Error(
        `Invalid input for updating connector ${connectorId}: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error(`Error updating connector (${connectorId}):`, error);
    throw new Error(`Failed to update connector ${connectorId} in Neo4j.`);
  }
}

export async function deleteConnector(connectorId: string): Promise<boolean> {
  if (
    !connectorId ||
    typeof connectorId !== 'string' ||
    connectorId.trim() === ''
  ) {
    throw new Error('Invalid connectorId provided for deletion.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');
  const session: Session = currentDriver.session();
  try {
    // Note: Deleting a connector might require deleting its cavities first or DETACH DELETE if cavities are connected
    // For now, using DETACH DELETE to remove connector and its relationships (like HAS_CAVITY)
    const result: QueryResult = await session.run(
      'MATCH (c:Connector {connectorId: $connectorId}) DETACH DELETE c',
      { connectorId }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
  } catch (error) {
    console.error(`Error deleting connector (${connectorId}):`, error);
    throw new Error(`Failed to delete connector ${connectorId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

// CRUD Operations for Cavity
export async function createCavity(
  data: CreateCavityInput
): Promise<CavityProperties | null> {
  try {
    const validatedData = CreateCavityInputSchema.parse(data);
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      // Optionally, check if connectorId exists before creating cavity
      const result: QueryResult = await session.run(
        'CREATE (cv:Cavity $props) RETURN cv',
        { props: validatedData }
      );
      return extractNodeProperties<CavityProperties>(result.records[0], 'cv');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating cavity:', error.errors);
      throw new Error(
        `Invalid input for creating cavity: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error('Error creating cavity:', error);
    throw new Error('Failed to create cavity in Neo4j.');
  }
}

export async function getCavityById(
  cavityId: string
): Promise<CavityProperties | null> {
  if (!cavityId || typeof cavityId !== 'string' || cavityId.trim() === '') {
    throw new Error('Invalid cavityId provided.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');
  const session: Session = currentDriver.session();
  try {
    const result: QueryResult = await session.run(
      'MATCH (cv:Cavity {cavityId: $cavityId}) RETURN cv',
      { cavityId }
    );
    if (result.records.length === 0) return null;
    return extractNodeProperties<CavityProperties>(result.records[0], 'cv');
  } catch (error) {
    console.error(`Error getting cavity by ID (${cavityId}):`, error);
    throw new Error(`Failed to retrieve cavity ${cavityId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

export async function updateCavity(
  cavityId: string,
  data: UpdateCavityInput
): Promise<CavityProperties | null> {
  if (!cavityId || typeof cavityId !== 'string' || cavityId.trim() === '') {
    throw new Error('Invalid cavityId provided for update.');
  }
  try {
    const validatedData = UpdateCavityInputSchema.parse(data);
    if (Object.keys(validatedData).length === 0) {
      throw new Error('No properties provided to update for cavity.');
    }
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        'MATCH (cv:Cavity {cavityId: $cavityId}) SET cv += $props RETURN cv',
        { cavityId, props: validatedData }
      );
      if (result.records.length === 0) return null;
      return extractNodeProperties<CavityProperties>(result.records[0], 'cv');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `Validation error updating cavity (${cavityId}):`,
        error.errors
      );
      throw new Error(
        `Invalid input for updating cavity ${cavityId}: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error(`Error updating cavity (${cavityId}):`, error);
    throw new Error(`Failed to update cavity ${cavityId} in Neo4j.`);
  }
}

export async function deleteCavity(cavityId: string): Promise<boolean> {
  if (!cavityId || typeof cavityId !== 'string' || cavityId.trim() === '') {
    throw new Error('Invalid cavityId provided for deletion.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');
  const session: Session = currentDriver.session();
  try {
    const result: QueryResult = await session.run(
      'MATCH (cv:Cavity {cavityId: $cavityId}) DETACH DELETE cv',
      { cavityId }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
  } catch (error) {
    console.error(`Error deleting cavity (${cavityId}):`, error);
    throw new Error(`Failed to delete cavity ${cavityId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

// CRUD Operations for Splice
export async function createSplice(
  data: CreateSpliceInput
): Promise<SpliceProperties | null> {
  try {
    const validatedData = CreateSpliceInputSchema.parse(data);
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        'CREATE (s:Splice $props) RETURN s',
        { props: validatedData }
      );
      return extractNodeProperties<SpliceProperties>(result.records[0], 's');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating splice:', error.errors);
      throw new Error(
        `Invalid input for creating splice: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error('Error creating splice:', error);
    throw new Error('Failed to create splice in Neo4j.');
  }
}

export async function getSpliceById(
  spliceId: string
): Promise<SpliceProperties | null> {
  if (!spliceId || typeof spliceId !== 'string' || spliceId.trim() === '') {
    throw new Error('Invalid spliceId provided.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');
  const session: Session = currentDriver.session();
  try {
    const result: QueryResult = await session.run(
      'MATCH (s:Splice {spliceId: $spliceId}) RETURN s',
      { spliceId }
    );
    if (result.records.length === 0) return null;
    return extractNodeProperties<SpliceProperties>(result.records[0], 's');
  } catch (error) {
    console.error(`Error getting splice by ID (${spliceId}):`, error);
    throw new Error(`Failed to retrieve splice ${spliceId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

export async function updateSplice(
  spliceId: string,
  data: UpdateSpliceInput
): Promise<SpliceProperties | null> {
  if (!spliceId || typeof spliceId !== 'string' || spliceId.trim() === '') {
    throw new Error('Invalid spliceId provided for update.');
  }
  try {
    const validatedData = UpdateSpliceInputSchema.parse(data);
    if (Object.keys(validatedData).length === 0) {
      throw new Error('No properties provided to update for splice.');
    }
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        'MATCH (s:Splice {spliceId: $spliceId}) SET s += $props RETURN s',
        { spliceId, props: validatedData }
      );
      if (result.records.length === 0) return null;
      return extractNodeProperties<SpliceProperties>(result.records[0], 's');
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        `Validation error updating splice (${spliceId}):`,
        error.errors
      );
      throw new Error(
        `Invalid input for updating splice ${spliceId}: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error(`Error updating splice (${spliceId}):`, error);
    throw new Error(`Failed to update splice ${spliceId} in Neo4j.`);
  }
}

export async function deleteSplice(spliceId: string): Promise<boolean> {
  if (!spliceId || typeof spliceId !== 'string' || spliceId.trim() === '') {
    throw new Error('Invalid spliceId provided for deletion.');
  }
  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');
  const session: Session = currentDriver.session();
  try {
    const result: QueryResult = await session.run(
      'MATCH (s:Splice {spliceId: $spliceId}) DETACH DELETE s',
      { spliceId }
    );
    return result.summary.counters.updates().nodesDeleted > 0;
  } catch (error) {
    console.error(`Error deleting splice (${spliceId}):`, error);
    throw new Error(`Failed to delete splice ${spliceId} from Neo4j.`);
  } finally {
    await session.close();
  }
}

// Relationship Management Functions

export async function addWireToCavity(
  wireId: string,
  cavityId: string,
  terminationData: TerminationProperties
): Promise<TerminationProperties | null> {
  if (!wireId || !cavityId)
    throw new Error('wireId and cavityId must be provided.');
  try {
    const validatedProps = TerminationPropertiesSchema.parse(terminationData);
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      // Ensure both Wire and Cavity exist before creating relationship
      const result: QueryResult = await session.run(
        `MATCH (w:Wire {wireId: $wireId})
         MATCH (c:Cavity {cavityId: $cavityId})
         MERGE (w)-[r:TERMINATES_IN]->(c)
         SET r = $props
         RETURN r`,
        { wireId, cavityId, props: validatedProps }
      );
      if (result.records.length === 0) {
        // This could happen if wire or cavity not found, or if MERGE had an issue (unlikely for SET)
        // Consider adding checks if wire/cavity exist first, or rely on MERGE's behavior
        console.warn(
          `Could not create TERMINATES_IN between Wire ${wireId} and Cavity ${cavityId}. One or both entities may not exist.`
        );
        return null;
      }
      return extractRelationshipProperties<TerminationProperties>(
        result.records[0],
        'r'
      );
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        'Validation error for termination properties:',
        error.errors
      );
      throw new Error(
        `Invalid termination properties: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error(`Error adding wire ${wireId} to cavity ${cavityId}:`, error);
    throw new Error('Failed to create TERMINATES_IN relationship.');
  }
}

export async function addCavityToConnector(
  cavityId: string,
  connectorId: string
): Promise<object | null> {
  if (!cavityId || !connectorId)
    throw new Error('cavityId and connectorId must be provided.');

  const currentDriver = getDriver();
  if (!currentDriver) throw new Error('Neo4j driver not initialized.');
  const session: Session = currentDriver.session();
  try {
    // Ensure both Connector and Cavity exist
    const result: QueryResult = await session.run(
      `MATCH (conn:Connector {connectorId: $connectorId})
       MATCH (cav:Cavity {cavityId: $cavityId})
       // Ensure cavity is not already connected to a different connector to maintain integrity
       // Or handle as an update if that's a valid scenario
       MERGE (conn)-[r:HAS_CAVITY]->(cav)
       RETURN r`,
      { cavityId, connectorId }
    );
    if (result.records.length === 0) {
      console.warn(
        `Could not create HAS_CAVITY between Connector ${connectorId} and Cavity ${cavityId}. One or both entities may not exist.`
      );
      return null;
    }
    // HAS_CAVITY has no properties for now, so return the relationship itself or a success indicator
    return result.records[0]?.get('r') || null;
  } catch (error) {
    console.error(
      `Error adding cavity ${cavityId} to connector ${connectorId}:`,
      error
    );
    throw new Error('Failed to create HAS_CAVITY relationship.');
  } finally {
    await session.close();
  }
}

export async function addWireToSplice(
  wireId: string,
  spliceId: string,
  joinData: JoinProperties
): Promise<JoinProperties | null> {
  if (!wireId || !spliceId)
    throw new Error('wireId and spliceId must be provided.');
  try {
    const validatedProps = JoinPropertiesSchema.parse(joinData);
    const currentDriver = getDriver();
    if (!currentDriver) throw new Error('Neo4j driver not initialized.');
    const session: Session = currentDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (w:Wire {wireId: $wireId})
         MATCH (s:Splice {spliceId: $spliceId})
         MERGE (w)-[r:JOINS_IN_SPLICE]->(s)
         SET r = $props
         RETURN r`,
        { wireId, spliceId, props: validatedProps }
      );
      if (result.records.length === 0) {
        console.warn(
          `Could not create JOINS_IN_SPLICE between Wire ${wireId} and Splice ${spliceId}. One or both entities may not exist.`
        );
        return null;
      }
      return extractRelationshipProperties<JoinProperties>(
        result.records[0],
        'r'
      );
    } finally {
      await session.close();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error for join properties:', error.errors);
      throw new Error(
        `Invalid join properties: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    console.error(`Error adding wire ${wireId} to splice ${spliceId}:`, error);
    throw new Error('Failed to create JOINS_IN_SPLICE relationship.');
  }
}

// Example of how to initialize driver, create indexes, and then use the functions
async function initializeApp() {
  try {
    getDriver();
    await createIndexes();

    // Further example usage can be added here for testing new entities and relationships
  } catch (error) {
    console.error('Application initialization failed:', error);
    await closeDriver();
  }
}

// Exports remain largely the same, but now include new CRUD and relationship functions
// (Actual export list managed by TypeScript module system)
