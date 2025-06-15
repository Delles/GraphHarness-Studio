import * as graphService from '../services/graph-service';
import sampleData from '../data/sample-data.json'; // Using ES module interop for JSON
import { Session } from 'neo4j-driver';

async function clearDatabase(session: Session): Promise<void> {
  console.log('Clearing existing database...');
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error; // Re-throw to stop seeding if clearing fails
  }
}

async function seedDatabase() {
  console.log('Starting database seeding process...');
  const driver = graphService.getDriver(); // Initialize or get existing driver
  if (!driver) {
    console.error('Failed to get Neo4j driver. Aborting seed.');
    return;
  }

  const session = driver.session();

  try {
    // Initialize indexes (idempotent)
    await graphService.createIndexes();
    console.log('Indexes ensured.');

    // Clear existing data (optional, use with caution)
    const shouldClearDatabase = process.env.CLEAR_DB_BEFORE_SEED === 'true';
    if (shouldClearDatabase) {
      await clearDatabase(session);
    } else {
      console.log('Skipping database clearing. Set CLEAR_DB_BEFORE_SEED=true to enable.');
    }

    // Seed Connectors
    console.log('\nSeeding Connectors...');
    for (const connData of sampleData.connectors) {
      const created = await graphService.createConnector(connData);
      console.log(`  Created Connector: ${created?.connectorId}`);
    }

    // Seed Cavities
    console.log('\nSeeding Cavities...');
    for (const cavityData of sampleData.cavities) {
      const created = await graphService.createCavity(cavityData);
      console.log(`  Created Cavity: ${created?.cavityId} for Connector: ${created?.connectorId}`);
    }

    // Seed Wires
    console.log('\nSeeding Wires...');
    for (const wireData of sampleData.wires) {
      // Type assertion because sampleData.wires might be too generic for createWire
      const created = await graphService.createWire(wireData as any);
      console.log(`  Created Wire: ${created?.wireId}`);
    }

    // Seed Splices
    console.log('\nSeeding Splices...');
    for (const spliceData of sampleData.splices) {
      const created = await graphService.createSplice(spliceData);
      console.log(`  Created Splice: ${created?.spliceId}`);
    }

    // Seed Relationships
    console.log('\nSeeding Relationships...');

    // Cavity to Connector (HAS_CAVITY)
    console.log('  Connecting Cavities to Connectors...');
    for (const rel of sampleData.relationships.cavityToConnector) {
      await graphService.addCavityToConnector(rel.cavityId, rel.connectorId);
      console.log(`    Connected Cavity ${rel.cavityId} to Connector ${rel.connectorId}`);
    }

    // Wire to Cavity (TERMINATES_IN)
    console.log('  Connecting Wires to Cavities...');
    for (const rel of sampleData.relationships.wireToCavity) {
      const { wireId, cavityId, ...props } = rel;
      await graphService.addWireToCavity(wireId, cavityId, props);
      console.log(`    Connected Wire ${wireId} to Cavity ${cavityId}`);
    }

    // Wire to Splice (JOINS_IN_SPLICE)
    console.log('  Connecting Wires to Splices...');
    for (const rel of sampleData.relationships.wireToSplice) {
      const { wireId, spliceId, ...props } = rel;
      await graphService.addWireToSplice(wireId, spliceId, props);
      console.log(`    Connected Wire ${wireId} to Splice ${spliceId}`);
    }

    console.log('\nDatabase seeding completed successfully!');

  } catch (error) {
    console.error('\nError during database seeding:', error);
  } finally {
    await session.close();
    // Close the main driver connection when the script finishes
    // This is important if the script is run standalone and not part of the main app lifecycle
    await graphService.closeDriver();
    console.log('Neo4j connection closed.');
  }
}

seedDatabase()
  .then(() => {
    console.log('Seeding script finished.');
  })
  .catch(error => {
    console.error('Unhandled error in seeding script:', error);
    process.exit(1); // Exit with error code if script fails catastrophically
  });
