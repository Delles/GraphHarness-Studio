# Neo4j Data Model and Property Indexes

This document outlines the Neo4j graph data model for the wire harness application, including node labels, their properties, relationships between them, and necessary property indexes.

## Node Labels and Properties

### 1. `Connector`
Represents a physical connector in the wire harness.

*   **`connectorId`**: `STRING` (Unique identifier for the connector, e.g., "CONN001") - **Indexed**
*   **`name`**: `STRING` (Descriptive name, e.g., "Main Engine Connector", "ECU Connector J1")
*   **`type`**: `STRING` (Type of connector, e.g., "Plug", "Socket", "Header")
*   **`partNumber`**: `STRING` (Manufacturer's part number, e.g., "DJ7021A-2.8-11")
*   **`manufacturer`**: `STRING` (Name of the manufacturer, e.g., "TE Connectivity", "Molex")

### 2. `Cavity`
Represents a single cavity within a connector that can accept a wire terminal.

*   **`cavityId`**: `STRING` (Unique identifier for the cavity, typically composite like `connectorId_cavityNumber`, e.g., "CONN001_A1") - **Indexed**
*   **`cavityNumber`**: `STRING` (Identifier for the cavity within its connector, e.g., "A1", "B2", "1", "23")
*   **`connectorId`**: `STRING` (Foreign key referencing `Connector.connectorId` to which this cavity belongs)
*   **`material`**: `STRING` (Plating material of the cavity contact, e.g., "Gold", "Tin", "Silver")
*   **`shape`**: `STRING` (Shape of the cavity contact, e.g., "Round", "Rectangular", "Tab")

### 3. `Wire`
Represents an individual wire in the harness.

*   **`wireId`**: `STRING` (Unique identifier for the wire, e.g., "WIRE001") - **Indexed**
*   **`name`**: `STRING` (Descriptive name or code, e.g., "CAN_H_1", "SENSOR_SIG_A", "100-RD-1.0")
*   **`crossSectionalArea`**: `FLOAT` (Cross-sectional area in mm², e.g., 0.5, 1.0, 2.5)
*   **`color`**: `STRING` (Insulation color(s), e.g., "Red", "Blue/White", "BK")
*   **`material`**: `STRING` (Conductor material, e.g., "Copper", "Aluminum", "Copper-Clad Aluminum")
*   **`length`**: `FLOAT` (Length of the wire in mm, e.g., 150.5)
*   **`insulationMaterial`**: `STRING` (Type of insulation, e.g., "PVC", "XLPE", "Teflon")
*   **`optionCode`**: `STRING` (Code for variant management, indicating which product configurations this wire belongs to, e.g., "OPTION_CODE_X", "BASE_MODEL_ONLY") - **Indexed**

### 4. `Splice`
Represents a point where two or more wires are joined.

*   **`spliceId`**: `STRING` (Unique identifier for the splice, e.g., "SPLICE001") - **Indexed**
*   **`type`**: `STRING` (Method or type of splice, e.g., "Ultrasonic", "Crimp", "Splice Block Terminal")
*   **`location`**: `STRING` (General location of the splice within the harness or vehicle, e.g., "Engine Bay LH", "Main Harness Trunk", "IP_HARNESS_SPL04")

## Relationships

### 1. `HAS_CAVITY`
Connects a `Connector` node to its constituent `Cavity` nodes.

*   **Path**: `(Connector)-[:HAS_CAVITY]->(Cavity)`
*   **Direction**: From `Connector` to `Cavity`.
*   **Properties**: None currently defined.

### 2. `TERMINATES_IN`
Connects a `Wire` node to a `Cavity` node where the wire end is terminated.

*   **Path**: `(Wire)-[:TERMINATES_IN]->(Cavity)`
*   **Direction**: From `Wire` to `Cavity`.
*   **Properties**:
    *   `terminationType`: `STRING` (Method of termination, e.g., "Crimp", "Solder", "Insulation Displacement")
    *   `seal`: `STRING` (Type or part number of any seal used at the termination point, e.g., "Weatherproof Seal P/N 123", "Cavity Plug S-10")

### 3. `JOINS_IN_SPLICE`
Connects a `Wire` node to a `Splice` node, indicating that the wire is part of that splice.

*   **Path**: `(Wire)-[:JOINS_IN_SPLICE]->(Splice)`
*   **Direction**: From `Wire` to `Splice`.
*   **Properties**:
    *   `details`: `STRING` (Optional details about this specific wire's connection in the splice, e.g., "Crimp specification XYZ", "Position 1 in splice block", "Input wire")

## Property Indexes

To ensure efficient querying, the following properties should be indexed:

*   **`Connector(connectorId)`**: For quick lookup of connectors by their unique ID.
*   **`Cavity(cavityId)`**: For quick lookup of cavities by their unique ID.
*   **`Wire(wireId)`**: For quick lookup of wires by their unique ID.
*   **`Wire(optionCode)`**: Crucial for performant filtering of wires based on product variants or options.
*   **`Splice(spliceId)`**: For quick lookup of splices by their unique ID.

This data model provides a foundational structure for representing wire harness designs in Neo4j, allowing for complex queries related to connectivity, bill of materials, and variant management.
