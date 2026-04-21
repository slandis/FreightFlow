# Game Design Document

## Working Title
**FreightFlow**

## 1. Overview

### 1.1 High Concept
*FreightFlow* is a real-time warehouse and logistics simulation game focused on managing freight productivity measured in **cubic feet of volume**. The player operates a warehouse facility, assigns storage zones, allocates labor, manages budget decisions, and responds to changing inbound and outbound freight demand while maintaining customer satisfaction, worker morale, safety, and warehouse condition.

The player’s success is determined by their ability to balance throughput, staffing, storage utilization, and operational quality in a dynamic freight environment.

### 1.2 Core Fantasy
The player is the operations leader of a busy freight warehouse, making tactical and strategic decisions to:
- Receive inbound freight efficiently
- Store freight in the correct locations
- Fulfill outbound demand quickly and accurately
- Maintain labor effectiveness and warehouse condition
- Grow earnings through high throughput and strong service levels

### 1.3 Genre
- Real-time simulation
- Tycoon / management sim
- Logistics / warehouse operations strategy

### 1.4 Platform Assumption
- PC first
- Mouse-driven controls
- Keyboard support for camera/navigation shortcuts

---

## 2. Design Pillars

1. **Operational realism with approachable controls**  
   Systems should resemble warehouse/logistics operations while remaining understandable and playable.

2. **Volume-driven management**  
   The primary lens of play is freight volume, storage capacity, and labor allocation.

3. **Strategic monthly planning plus real-time execution**  
   Players make high-level monthly decisions, then manage consequences in real time.

4. **Meaningful spatial design**  
   Warehouse layout, travel paths, dock access, and zone placement materially affect performance.

5. **Tradeoffs everywhere**  
   Higher productivity may reduce morale or safety; cost control may hurt condition or satisfaction.

---

## 3. Core Gameplay Loop

### 3.1 Macro Loop
1. Start a new month
2. Review monthly business planning dialog
3. Examine forecast demand, labor status, warehouse condition, satisfaction, and budget
4. Allocate budget and labor resources
5. Resume simulation
6. Process inbound and outbound freight in real time
7. Earn money from throughput
8. Deal with bottlenecks, morale issues, maintenance decline, and service problems
9. Reach end of month and repeat

### 3.2 Moment-to-Moment Loop
1. Trailers appear in trailer yard with inbound freight
2. Switch drivers move trailers to doors
3. Unload drivers unload inbound freight to dock
4. Storage drivers move freight into valid storage zones
5. Outbound orders generate from stored freight
6. Picking drivers retrieve freight to dock
7. Load/unload drivers move outbound freight from dock into door-loaded trailers
8. Switch drivers move completed trailers from doors to trailer yard
9. Player monitors KPIs and adjusts speed, zones, and labor priorities

---

## 4. Time and Game Speed

### 4.1 Running Clock
The game runs on a continuous in-game clock.

### 4.2 Speed Settings
The player can choose among:
- **Paused**
- **Slow**
- **Medium**
- **Fast**

### 4.3 Monthly Planning Trigger
At the **beginning of each month**:
- Simulation automatically switches to **Slow** speed
- A **Monthly Business Planning** dialog opens
- Player may review, adjust, and confirm monthly plans before continuing

---

## 5. Economy and Scoring

### 5.1 Core Economic Metric
Money is earned based on **throughput volume**.

### 5.2 Throughput Formula
**Throughput Volume = (Inbound Volume + Outbound Volume) / 2**

### 5.3 Economic Inputs
Revenue and business health are influenced by:
- Completed throughput volume
- Client/customer satisfaction
- Freight handling performance
- Safety performance
- Warehouse condition
- Labor effectiveness

### 5.4 Suggested Economic Outputs
The game economy should track at minimum:
- Cash on hand
- Monthly revenue
- Monthly labor cost
- Maintenance cost
- Training cost
- Safety investment cost
- Net operating result

---

## 6. Difficulty and Game Modes

### 6.1 Starting Difficulty Modes
The game starts with a player-selected mode:
- **Amateur**
- **Seasoned**
- **Pro**
- **God**

### 6.2 Mode Differences
Each mode should vary in:
- Starting cash
- Forecast accuracy / forecast model behavior
- Demand volatility
- Tolerance for service failures
- Cost pressure
- Negative event frequency

### 6.3 Forecasting by Mode
Suggested design intent:
- **Amateur**: forgiving, more stable and more accurate forecasts
- **Seasoned**: moderate variation and occasional surprises
- **Pro**: volatile freight patterns and lower forecast certainty
- **God**: extreme complexity, highly dynamic forecasts, strong penalties for poor planning

---

## 7. Warehouse Map and Spatial Rules

### 7.1 Map Structure
- Warehouse is represented by a **64 x 64 tile grid**
- View is **isometric**
- Camera supports **pan and zoom**

### 7.2 Tile Assignment
Each tile can be assigned a zone type.

### 7.3 Outer Edge Rule
The **outer edge of the grid** is reserved and automatically assigned as **dock zones**.

### 7.4 Zone Drawing
Players assign zones using **click-drag painting** across tiles.

### 7.5 Travel Tile Requirement
A special tile type defines **travel zones**.

Storage or functional zoned tiles that are **not within 3 tiles of a travel-zoned tile** are not considered operationally valid for use.

### 7.6 Distance Tracking
The system tracks travel distance from dock tiles to storage tiles by calculating tile distance from a dock location to the destination tile.

### 7.7 Trailer Movement Assumption
Trailers moved by switch drivers always assume a fixed travel distance of **8 tiles**.

---

## 8. Zone System

### 8.1 Purpose of Zones
Zones define what type of freight may be stored in a given area.

### 8.2 Zone Categories
The exact zone set can expand over time, but the initial design should support:
- Unassigned
- Travel
- Dock
- Freight Class A storage
- Freight Class B storage
- Freight Class C storage
- Temperature / special handling storage
- Oversize / irregular storage
- High-priority fast-turn storage

### 8.3 Freight Compatibility
Freight may only be stored in compatible zone types.

### 8.4 Invalid Zone Logic
A storage zone is unusable if:
- It is incompatible with the freight class
- It lacks path access via travel tiles
- It is more than 3 tiles away from a travel tile
- It is full

### 8.5 Zone Efficiency Considerations
Zone performance may be modified by:
- Distance to dock
- Congestion level
- Freight mix compatibility
- Labor availability
- Warehouse condition

---

## 9. Freight Model

### 9.1 Core Freight Unit
Freight is measured in **cubic feet**.

### 9.2 Freight Classes
The game should support multiple classes of freight to create operational complexity. Each freight class can vary by:
- Storage compatibility
- Space requirement
- Handling complexity
- Priority / service expectations
- Loading/unloading time

### 9.3 Freight States
Freight transitions through states such as:
- In trailer yard
- At warehouse door
- On dock
- In storage
- Picked for outbound
- Loaded to outbound trailer
- Completed outbound shipment

---

## 10. Inbound Process

### 10.1 Inbound Generation
As the game progresses, the trailer storage yard populates randomly with trailers containing inbound freight.

### 10.2 Inbound Workflow
1. Trailer appears in trailer yard
2. **Switch driver** moves trailer to warehouse door
3. **Unload driver(s)** unload freight from trailer to dock
4. **Storage driver(s)** move freight from dock into appropriate storage zones

### 10.3 Inbound Constraints
Inbound efficiency is constrained by:
- Door availability
- Switch driver availability
- Unload driver availability
- Storage driver availability
- Valid storage capacity
- Distance to destination zones
- Warehouse congestion
- Warehouse condition

### 10.4 Inbound KPIs
- Inbound volume processed
- Trailer dwell time in yard
- Door dwell time
- Dock congestion
- Average putaway time
- Storage utilization

---

## 11. Outbound Process

### 11.1 Outbound Order Generation
As inbound freight is unloaded and stored, outbound orders begin generating.

### 11.2 Outbound Workflow
1. Outbound order is created based on stored freight
2. **Picking driver(s)** pick freight from storage and place it at dock
3. **Unload/load driver(s)** move freight from dock into door-loaded trailers
4. **Switch driver(s)** move completed trailers from doors back to trailer yard

### 11.3 Outbound Constraints
Outbound efficiency is constrained by:
- Inventory availability in storage
- Picking labor availability
- Dock capacity
- Door availability
- Trailer availability at doors
- Switch driver availability
- Travel distance from storage to dock
- Congestion and condition penalties

### 11.4 Outbound KPIs
- Outbound volume processed
- Order cycle time
- Pick completion rate
- Trailer turn time
- Missed shipment demand
- On-time service level

---

## 12. Labor System

### 12.1 Labor as a Limited Resource
Labor is finite and must be allocated across functional areas.

### 12.2 Functional Labor Areas
Player can assign labor resources to:
- Inbound unloading
- Inbound storage
- Outbound picking
- Outbound loading
- Trailer movement from yard to doors and doors to yard
- Sanitation
- Management

### 12.3 Worker Attributes
The workforce should track:
- Headcount
- Morale / engagement
- Overall skill
- Skill gaps by function
- Safety behavior / reliability
- Fatigue or strain potential (optional future extension)

### 12.4 Labor Effects
Labor allocation affects:
- Processing speed
- Error rate
- Safety performance
- Morale
- Customer/client satisfaction
- Warehouse condition

### 12.5 Management Labor
Management labor can improve:
- Coordination
- Issue response
- Productivity stability
- Morale retention
- Forecast responsiveness

---

## 13. Warehouse Condition System

### 13.1 Warehouse Health Factors
Warehouse condition should be tracked through metrics such as:
- Cleanliness
- Maintenance backlog
- Space utilization pressure
- Congestion
- Operational readiness

### 13.2 Condition Effects
Poor warehouse condition may reduce:
- Movement speed
- Safe capacity
- Worker morale
- Client/customer satisfaction
- Safety score

### 13.3 Recovery Levers
The player can improve warehouse condition through:
- Maintenance budget
- Sanitation labor allocation
- Lower congestion
- Better layout planning

---

## 14. Satisfaction Systems

### 14.1 Client Satisfaction
Represents how business clients view service reliability and capacity.

Potential drivers:
- Forecast adherence
- Throughput stability
- Missed shipments
- Service responsiveness
- Capacity availability

### 14.2 Customer Satisfaction
Represents end-service quality and shipment performance.

Potential drivers:
- Outbound timeliness
- Inventory availability
- Delays
- Handling quality
- Safety/quality incidents

### 14.3 Workforce Morale / Engagement
Represents internal labor sentiment.

Potential drivers:
- Staffing sufficiency
- Training investment
- Safety investment
- Management support
- Workload pressure
- Facility condition
- Budget priorities

---

## 15. Monthly Business Planning Dialog

At the beginning of each month, the player is presented with a multi-page planning dialog.

### 15.1 Forecast Page
Shows:
- Forecast inbound volume for the month
- Forecast outbound volume for the month
- Forecast volatility / confidence
- Freight class mix
- Expected peak periods

### 15.2 Workforce / Labor Page
Shows:
- Total headcount
- Morale / engagement
- Overall skill level
- Skill gaps by function
- Staffing shortages or surpluses
- Labor efficiency modifiers

### 15.3 Warehouse Condition Page
Shows:
- Total storage space available
- Total assigned space
- Total unassigned space
- Cleanliness
- Maintenance issues
- Congestion risk
- Utilization by zone class

### 15.4 Client and Customer Satisfaction Page
Shows:
- Satisfaction scores and trend lines
- Breakdown by cause
- Service delays
- Missed demand indicators
- Quality and safety impacts on satisfaction

### 15.5 Budgeting Page
Player allocates budget across categories such as:
- Payroll / headcount
- Warehouse maintenance
- Labor tasks / operational support
- Workforce training
- Safety
- Potential contingency reserve

### 15.6 Productivity Page
Shows running KPIs including:
- Inbound volume
- Outbound volume
- Throughput volume
- Safety score

This page also allows the player to define labor assignments to functional areas:
- Inbound unloading
- Inbound storage
- Outbound picking
- Outbound loading
- Trailer movement
- Sanitation
- Management

---

## 16. Start State

### 16.1 Initial Conditions
At game start:
- No zones are assigned except auto-assigned outer dock edge
- Player begins with cash determined by selected difficulty mode
- Warehouse must be organized by the player
- Freight forecast quality depends on game mode

### 16.2 Early Game Goals
The player must:
- Create travel paths
- Assign valid storage zones
- Balance labor across core functions
- Avoid creating inaccessible or unusable storage space
- Begin generating throughput quickly enough to sustain finances

---

## 17. Spatial and Operational Rules Summary

### 17.1 Tile Use Rules
- Outer edge tiles are automatically dock zones
- Players manually assign interior tiles
- Travel tiles are required for operational access
- Storage zones farther than 3 tiles from a travel tile are invalid for use

### 17.2 Distance Rules
- Storage movement uses tile distance from dock to destination
- Longer distances reduce effective labor throughput
- Switch trailer moves always assume 8 tiles of distance

### 17.3 Capacity Rules
- Freight consumes cubic-foot storage capacity
- Available space must exist in a compatible and valid zone
- Excess freight may bottleneck on trailers or dock if storage is unavailable

---

## 18. Failure States and Pressure Systems

The game should create pressure through compounding operational failures rather than immediate loss alone.

### 18.1 Operational Failure Examples
- Yard fills with waiting trailers
- Doors become blocked
- Dock congestion rises
- Storage space becomes unavailable
- Outbound orders cannot be fulfilled
- Morale drops
- Satisfaction drops
- Maintenance issues multiply
- Cash flow deteriorates

### 18.2 Loss Conditions (Suggested)
Possible failure conditions include one or more of:
- Bankruptcy / negative cash threshold
- Satisfaction collapse for a sustained period
- Safety collapse for a sustained period
- Chronic freight backlog beyond recoverable threshold

---

## 19. Win State / Progression (Suggested)

Although the current concept is primarily sandbox-simulation driven, the game can support progression through:
- Monthly profit goals
- Throughput milestones
- Service score targets
- Scenario completion objectives
- Long-term business growth

Possible long-term progression systems:
- Unlock new warehouse types
- Unlock additional freight classes
- Unlock advanced forecasting tools
- Unlock labor automation modifiers
- Unlock better management capabilities

---

## 20. User Interface

### 20.1 Main View
The main gameplay view is an isometric warehouse map with:
- 64x64 grid
- Zoom controls
- Pan controls
- Tile hover information
- Zone painting tools
- Visible dock edge
- Visible travel routes and zone overlays

### 20.2 Top-Level HUD
Suggested HUD elements:
- Current date/time
- Current game speed
- Cash on hand
- Inbound volume this period
- Outbound volume this period
- Throughput volume
- Satisfaction indicators
- Morale indicator
- Warehouse condition indicator
- Alerts / warnings

### 20.3 Management Panels
Suggested quick-access panels:
- Labor assignments
- Zone legend / paint tool
- Freight backlog monitor
- Door and yard status
- KPI dashboard
- Monthly planning button/status

### 20.4 Alerts
Examples:
- No valid storage for freight class
- Dock congestion critical
- Morale falling
- Maintenance overdue
- Outbound orders delayed
- Customer satisfaction declining
- Not enough switch drivers

---

## 21. Systems Interdependency

The design should emphasize cross-system interaction.

Examples:
- Increasing freight volume without adding labor causes backlogs
- Cutting maintenance budget may improve short-term cash but reduce condition and safety
- Poor travel layout increases travel time and lowers throughput
- Understaffing sanitation may reduce condition and morale
- Weak training reduces skill and productivity while increasing errors
- Poor outbound performance harms customer satisfaction and revenue potential

---

## 22. Data Model Suggestions

### 22.1 Key Sim Entities
- Tile
- Zone
- Travel network
- Dock door
- Trailer
- Freight batch
- Labor pool
- Functional labor assignment
- Order
- Budget plan
- Satisfaction profile
- Warehouse condition profile
- Forecast record

### 22.2 Important Metrics to Track
- Inbound cubic feet processed
- Outbound cubic feet processed
- Throughput cubic feet
- Trailer counts
- Door utilization
- Storage utilization
- Valid vs invalid assigned space
- Labor utilization by function
- Morale
- Skill
- Safety score
- Maintenance backlog
- Customer satisfaction
- Client satisfaction
- Revenue and costs

---

## 23. AI / Simulation Behavior Suggestions

### 23.1 Freight Arrival Logic
- Inbound arrivals should be randomized within monthly forecast constraints
- Peaks and troughs should vary by game mode and forecast model

### 23.2 Order Generation Logic
- Outbound orders should generate based on stored freight and demand curves
- Certain freight classes may have higher urgency or stricter service targets

### 23.3 Labor Processing Logic
Each labor role should process work according to:
- Assigned headcount
- Skill
- Morale
- Distance traveled
- Congestion
- Warehouse condition
- Safety and fatigue modifiers if implemented

---

## 24. Technical Notes / Prototype Priorities

### 24.1 Prototype Priority Order
1. Grid rendering and camera controls
2. Tile zoning and travel tile validation
3. Freight class and storage compatibility logic
4. Inbound process simulation
5. Outbound process simulation
6. Labor allocation system
7. Throughput and money calculation
8. Monthly planning dialog
9. Satisfaction, morale, and warehouse condition systems
10. Difficulty modes and forecasting variation

### 24.2 Minimum Viable Prototype
A first playable version should include:
- 64x64 isometric grid
- Dock edge auto-assignment
- Travel and storage zoning
- At least 3 freight classes
- Inbound trailer spawning
- Outbound order generation
- Switch / unload / storage / picking labor roles
- Running clock and speed controls
- Throughput-based earnings
- Basic monthly planning screen

---

## 25. Resolved Design Decisions

The following design decisions are now considered the baseline for the initial version of the game.

### 25.1 Initial Freight Classes
The initial release will support **5 freight classes**:
- **Standard Freight**
- **Small / Fast-Turn Freight**
- **Bulk Freight**
- **Oversize / Irregular Freight**
- **Special Handling Freight**

Each freight class should define:
- cube per unit
- compatible zone types
- unload speed modifier
- storage speed modifier
- pick speed modifier
- service priority
- satisfaction penalty if delayed

### 25.2 Labor Model
Labor will be modeled as **pooled headcount by function** rather than individually simulated workers.

The player assigns labor across functional pools such as:
- switch drivers
- unloaders
- storage drivers
- pickers
- loaders
- sanitation
- management

The workforce also tracks higher-level shared attributes:
- morale / engagement
- overall skill
- safety culture
- attendance reliability

This model keeps the simulation manageable while preserving meaningful labor strategy.

### 25.3 Pathfinding and Travel Logic
Movement will use **A* pathfinding on travel tiles only**.

Rules:
- travel tiles form the valid movement network
- freight movement requires a valid path between operational points
- storage tiles must be within 3 tiles of at least one travel tile to be operationally valid
- the shortest valid travel path determines movement distance
- if no valid path exists, the destination tile is unusable

This makes layout and travel planning a core strategic system.

### 25.4 Dock Door Model
The initial release will support **16 active dock doors**.

Recommended initial split:
- **6 inbound-preferred doors**
- **6 outbound-preferred doors**
- **4 flexible doors**

Representation rules:
- the entire outer ring remains visually and functionally dock-zoned
- only designated dock nodes operate as active doors
- freight must route through a valid door node rather than any outer dock tile

This keeps dock operations as a meaningful bottleneck and planning constraint.

### 25.5 Outbound Loading Role
Outbound loading will be handled by a distinct **loader** labor role rather than sharing the unloader role.

Initial core functional labor groups are:
- switch drivers
- unloaders
- storage drivers
- pickers
- loaders
- sanitation
- management

Optional difficulty scaling may allow easier modes to merge unloaders and loaders into a shared dock crew, but the default simulation model treats them as separate functions.

### 25.6 Safety Model
Safety will use a **light-to-medium detail abstract system** centered around a **Safety Score** from 0 to 100.

Safety performance is influenced by:
- safety budget
- training investment
- morale
- warehouse condition
- congestion
- workload pressure
- freight mix difficulty

Safety events are abstracted into categories such as:
- near misses
- minor incidents
- reportable incidents
- severe incidents

Safety issues may cause:
- temporary labor efficiency loss
- morale decline
- satisfaction decline
- operating cost spikes
- reduced available labor
- forced slowdowns in severe cases

### 25.7 Contracts, Client Profiles, and Seasonality
The initial release will include:
- **contracts**
- **client profiles**
- **seasonal demand behavior**

#### Contracts
Contracts define:
- expected monthly inbound volume
- expected monthly outbound volume
- freight class mix
- service expectations
- revenue multiplier
- satisfaction sensitivity

#### Client Profiles
Initial client profile examples include:
- **Retail Client**
- **Industrial Client**
- **High-Touch Client**
- **Low-Margin Volume Client**

These profiles differentiate demand shape, margin, service expectations, and freight complexity.

#### Seasonality
Demand varies month to month through:
- predictable seasonal patterns
- peak and shoulder periods
- random forecast misses influenced by difficulty mode

This supports richer monthly planning and more varied play.

### 25.8 Unassigned Space and Flexibility
Unassigned interior space provides a **flexibility and anti-congestion benefit**.

Benefits of keeping some space unassigned include:
- reduced congestion
- easier rezoning
- temporary overflow flexibility
- slight morale and warehouse condition benefits
- reduced crowding pressure on travel lanes

Suggested assigned-space pressure thresholds:
- **0–70% assigned:** normal
- **70–85% assigned:** mild congestion risk
- **85–95% assigned:** strong congestion penalty
- **95%+ assigned:** severe congestion and condition decline

This prevents optimal play from becoming full-map overassignment and rewards thoughtful layout planning.

### 25.9 Storage Capacity Model
Storage should be calculated in **cubic-foot capacity**, with tiles representing zone footprint rather than single discrete item slots.

Example implementation:
- each storage tile contributes a cubic-foot capacity value
- different zone types may provide different capacity and efficiency values

Example values for tuning:
- standard zone tile: 500 cu ft
- bulk zone tile: 800 cu ft
- fast-turn zone tile: 350 cu ft with speed bonuses

This keeps the map important while grounding the simulation in freight volume.

### 25.10 Management Role Design
Management does not directly move freight. Instead, management acts as a multiplier role that improves operational performance through:
- better labor coordination
- morale stability
- faster issue recovery
- improved forecast responsiveness
- more consistent productivity

### 25.11 Door Queue Visibility
Dock doors should expose visible operational status so players can understand bottlenecks.

Each active door should track and surface:
- assigned trailer status
- queue length
- current process phase
- dock congestion rating

---

## 26. Future Expansion Questions

The following questions are intentionally deferred for future iterations rather than required for the initial release:

- Should automation systems such as conveyor assistance, autonomous equipment, or software optimization upgrades be added later?
- Should labor include individual named workers, certifications, or promotion systems in an advanced mode?
- Should weather, road network disruption, or external transportation delays affect trailer arrivals and outbound service?
- Should multiple warehouse building layouts or building expansion options be included?
- Should clients negotiate contract renewals, pricing pressure, or penalties in more detail?
- Should safety evolve into a more event-driven compliance and audit system?
- Should the player manage equipment fleets such as forklifts, clamp trucks, and pallet jacks directly?
- Should different dock door types or trailer types introduce further specialization?
- Should campaign scenarios, sandbox mode modifiers, or challenge maps be added?
- Should multiplayer, leaderboards, or shared scenario seeds be supported?

---

## 27. Core Simulation Formulas

The following formulas establish a practical baseline simulation model for prototype and balancing work. All values should be treated as tunable.

### 27.1 Time Step Model
The simulation runs on a repeating time step.

Suggested baseline:
- **1 simulation tick = 1 in-game minute**

Game speed multipliers:
- **Paused** = 0x
- **Slow** = 1x
- **Medium** = 3x
- **Fast** = 6x

These multipliers adjust how quickly simulation ticks are processed relative to real time.

### 27.2 Throughput Volume
Throughput is the primary business productivity metric.

**Throughput Volume = (Inbound Volume Processed + Outbound Volume Processed) / 2**

Where:
- inbound volume processed = total cubic feet successfully stored during the measured period
- outbound volume processed = total cubic feet successfully shipped during the measured period

### 27.3 Revenue Formula
Base revenue should be driven by throughput volume and modified by business quality factors.

**Revenue = Throughput Volume × Base Revenue per Cu Ft × Contract Modifier × Satisfaction Modifier × Safety Modifier**

Suggested baseline components:
- **Base Revenue per Cu Ft** = tunable by scenario
- **Contract Modifier** = 0.8 to 1.5
- **Satisfaction Modifier** = 0.7 to 1.2
- **Safety Modifier** = 0.85 to 1.05

This allows operational performance to affect earnings without replacing throughput as the core driver.

### 27.4 Cost Formula
Monthly operating cost should aggregate major cost categories.

**Monthly Cost = Payroll Cost + Maintenance Cost + Training Cost + Safety Program Cost + Incident Cost + Other Fixed Costs**

Suggested components:
- **Payroll Cost = Total employed headcount × wage rate**
- **Maintenance Cost = chosen budget allocation + reactive repair penalties**
- **Training Cost = training budget allocation**
- **Safety Program Cost = safety budget allocation**
- **Incident Cost = sum of safety event penalties during period**

Balancing note:
- recurring labor, budget, and fixed operating costs should remain in the same economic scale as plausible monthly freight revenue
- baseline warehouse staffing should create meaningful pressure on cash without making the default contract portfolio mathematically impossible to sustain
- condition and safety cost penalties should act as amplifiers on a stable operating baseline, not dominate the entire cost model by default

### 27.5 Net Cash Change
**Net Cash Change = Revenue - Monthly Cost**

**Ending Cash = Starting Cash + Net Cash Change**

### 27.6 Freight Arrival Formula
Inbound freight arrivals should follow forecast plus random variation.

**Actual Inbound Volume = Forecast Inbound Volume × Seasonality Modifier × Random Demand Modifier**

**Actual Outbound Demand = Forecast Outbound Volume × Seasonality Modifier × Random Demand Modifier**

Suggested ranges by difficulty:
- **Amateur:** Random Demand Modifier = 0.95 to 1.05
- **Seasoned:** 0.90 to 1.10
- **Pro:** 0.80 to 1.20
- **God:** 0.65 to 1.35

Freight class mix can be generated using weighted percentages defined by contract and seasonal profile.

### 27.7 Storage Capacity Formula
Storage is measured in cubic feet rather than discrete pallet slots.

**Zone Capacity = Number of Assigned Tiles × Capacity per Tile × Condition Capacity Modifier**

Suggested examples:
- standard storage tile = 500 cu ft
- bulk storage tile = 800 cu ft
- fast-turn storage tile = 350 cu ft
- special handling tile = 300 to 600 cu ft depending on type

**Condition Capacity Modifier** suggested range:
- excellent condition = 1.00
- fair condition = 0.95
- poor condition = 0.85

**Available Capacity = Zone Capacity - Stored Volume**

### 27.8 Freight Handling Rate Formula
Each labor pool contributes cubic feet processed per hour.

**Functional Processing Rate = Assigned Headcount × Base Rate per Worker × Skill Modifier × Morale Modifier × Condition Modifier × Safety Modifier × Management Modifier × Congestion Modifier**

Suggested baseline modifiers:
- **Skill Modifier** = 0.70 to 1.25
- **Morale Modifier** = 0.75 to 1.15
- **Condition Modifier** = 0.80 to 1.05
- **Safety Modifier** = 0.90 to 1.05
- **Management Modifier** = 1.00 to 1.15
- **Congestion Modifier** = 0.60 to 1.00

Each functional area should have its own **Base Rate per Worker**, for example:
- switch driver: trailers moved per hour
- unloader: cu ft unloaded per hour
- storage driver: cu ft put away per hour
- picker: cu ft picked per hour
- loader: cu ft loaded per hour
- sanitation: condition recovery points per hour
- management: management support points per hour

### 27.9 Travel Time Formula
Movement of freight between dock and storage should be slowed by travel distance.

**Travel Time per Move = Base Travel Time × Distance in Tiles / Travel Speed Modifier**

Where:
- **Distance in Tiles** = shortest valid path length on travel tiles plus local handoff distance
- **Travel Speed Modifier** is affected by congestion, condition, and freight class handling complexity

Suggested expanded form:

**Travel Time per Move = Base Travel Time × Distance × Freight Handling Modifier / (Condition Travel Modifier × Congestion Travel Modifier)**

Suggested constants:
- **Base Travel Time** = 0.15 to 0.30 in-game hours per tile-equivalent unit
- switch trailer moves always use **Distance = 8**

### 27.10 Effective Putaway and Pick Time
Freight movement tasks should combine processing time and travel time.

**Effective Putaway Time = Unload Time + Travel Time to Storage + Placement Time**

**Effective Pick Time = Pick Time + Travel Time to Dock + Dock Placement Time**

These task times determine queue throughput and backlog growth.

### 27.11 Queue Growth Formula
Each functional area may accumulate backlog when incoming work exceeds available processing rate.

**Queue Change per Tick = Work Arriving per Tick - Work Processed per Tick**

**New Queue Size = Max(0, Old Queue Size + Queue Change)**

Separate queues should exist at minimum for:
- yard trailer queue
- dock unload queue
- storage queue
- picking queue
- loading queue
- outbound departure queue

### 27.12 Congestion Formula
Congestion should increase as space assignment, queue pressure, and door activity intensify.

Suggested congestion score:

**Congestion Score = (Space Assignment Pressure × 0.35) + (Average Queue Pressure × 0.35) + (Door Utilization Pressure × 0.30)**

Where each component is normalized from 0 to 1.

Suggested congestion modifier:

**Congestion Modifier = 1.0 - (Congestion Score × Congestion Severity Factor)**

Suggested severity factor:
- **0.3 to 0.5** depending on difficulty or scenario

### 27.13 Space Assignment Pressure
Suggested pressure thresholds:
- 0% to 70% assigned = low pressure
- 70% to 85% assigned = mild pressure
- 85% to 95% assigned = high pressure
- 95%+ assigned = critical pressure

Suggested formula:

**Space Assignment Pressure = Assigned Interior Storage Space / Total Usable Interior Space**

This value feeds congestion, condition decline risk, and flexibility penalties.

### 27.14 Warehouse Condition Formula
Warehouse condition is a 0 to 100 score.

**Condition Change per Period = Maintenance Gain + Sanitation Gain - Congestion Wear - Deferred Maintenance Penalty - Incident Penalty**

**New Condition = Clamp(0, 100, Old Condition + Condition Change)**

Suggested components:
- **Maintenance Gain** from maintenance budget
- **Sanitation Gain** from sanitation labor
- **Congestion Wear** increases with congestion score
- **Deferred Maintenance Penalty** increases when maintenance budget is below target
- **Incident Penalty** triggered by safety events or severe operational failures

### 27.15 Morale / Engagement Formula
Morale is a 0 to 100 score.

**Morale Change per Period = Pay Support + Training Support + Safety Support + Management Support - Workload Stress - Backlog Stress - Condition Stress - Incident Stress**

**New Morale = Clamp(0, 100, Old Morale + Morale Change)**

Suggested interpretation:
- better payroll/headcount support reduces workload stress
- training investment improves confidence and morale
- poor warehouse condition and persistent backlogs drag morale downward

### 27.16 Skill Formula
Skill is a 0 to 100 score and can be global or role-specific.

**Skill Change per Month = Training Gain - Attrition Penalty**

**Training Gain = Training Budget × Training Efficiency Modifier**

**Attrition Penalty** may increase when morale is low or workload is sustained at high levels.

Skill feeds the **Skill Modifier** in labor processing formulas.

### 27.17 Safety Score Formula
Safety is a 0 to 100 score.

**Safety Change per Period = Safety Investment Gain + Training Gain + Condition Support - Congestion Risk - Workload Risk - Morale Risk**

**New Safety Score = Clamp(0, 100, Old Safety Score + Safety Change)**

Where:
- low morale increases risky behavior
- high congestion increases incident likelihood
- poor condition reduces safety performance

### 27.18 Safety Incident Probability
Safety incidents should use a probability curve rather than fixed deterministic triggers.

Suggested monthly incident risk:

**Incident Risk = Base Incident Risk × Congestion Risk Modifier × Condition Risk Modifier × Morale Risk Modifier × Workload Risk Modifier × Freight Complexity Modifier / Safety Protection Modifier**

Possible event categories can then roll against threshold bands.

Example structure:
- very low result = no event
- low result = near miss
- moderate result = minor incident
- higher result = reportable incident
- highest result = severe incident

### 27.19 Satisfaction Formula
Track **Client Satisfaction** and **Customer Satisfaction** separately, both on a 0 to 100 scale.

#### Client Satisfaction
**Client Satisfaction Change = Forecast Adherence Gain + Throughput Reliability Gain - Missed Volume Penalty - Contract Failure Penalty - Severe Incident Penalty**

#### Customer Satisfaction
**Customer Satisfaction Change = On-Time Service Gain + Fulfillment Gain - Delay Penalty - Error Penalty - Damage Penalty - Severe Incident Penalty**

**New Satisfaction = Clamp(0, 100, Old Satisfaction + Satisfaction Change)**

Suggested effects:
- higher satisfaction improves revenue modifiers and contract stability
- low satisfaction increases churn risk or revenue penalties

### 27.20 Forecast Accuracy Formula
Forecasts should vary by difficulty and client profile.

**Forecast Error % = Base Error by Difficulty × Seasonality Complexity × Client Volatility Modifier × Random Variation**

Suggested baseline error by difficulty:
- **Amateur:** 3% to 6%
- **Seasoned:** 6% to 10%
- **Pro:** 10% to 18%
- **God:** 15% to 30%

Displayed forecast values in the planning dialog can show a range rather than a single point estimate.

### 27.21 Door Utilization Formula
Each door should track active usage.

**Door Utilization = Active Door Processing Time / Total Available Door Time**

Suggested interpretation:
- below 60% = healthy
- 60% to 80% = busy
- 80% to 95% = strained
- 95%+ = critical bottleneck risk

Door utilization feeds congestion and service delay risk.

### 27.22 Trailer Dwell Time
Trailer dwell is an important logistics KPI.

**Yard Dwell Time = Time Trailer Waits in Yard Before Door Assignment**

**Door Dwell Time = Time Trailer Occupies a Door Before Release**

High dwell times should reduce satisfaction and indicate labor or door bottlenecks.

### 27.23 Contract Performance Score
Contracts may evaluate warehouse performance with a composite score.

**Contract Performance Score = (Throughput Achievement × 0.35) + (On-Time Service × 0.25) + (Client Satisfaction × 0.20) + (Safety Score × 0.10) + (Forecast Adherence × 0.10)**

This score can be used for:
- renewal outcomes
- bonus revenue
- penalty triggers
- difficulty scaling in campaign scenarios

### 27.24 Monthly Planning Budget Allocation Effects
Monthly budget allocations should modify system outputs through multipliers.

Examples:
- **Payroll / Headcount Budget** increases available labor and reduces workload stress
- **Maintenance Budget** improves warehouse condition recovery and capacity stability
- **Training Budget** increases skill growth and safety support
- **Safety Budget** improves safety score and reduces incident risk
- **Operational Task Budget** may improve support efficiency or reduce queue buildup

### 27.25 Recommended Prototype Tuning Values
Suggested initial starting ranges for prototype balance:
- starting morale: **70**
- starting safety: **75**
- starting condition: **80**
- starting skill: **65**
- management modifier baseline: **1.00**
- congestion severity factor: **0.40**
- base revenue per cu ft: scenario-defined, suggested early prototype range **0.15 to 0.60**

These values should be playtested and rebalanced after the first functional prototype.

---

## 28. Technical Architecture / Systems Breakdown

This section translates the design into a practical engineering structure for implementation. The intent is to support a clean prototype architecture that can later be expanded without rewriting core simulation systems.

### 28.1 Architectural Goals
The technical architecture should prioritize:
- deterministic simulation behavior where possible
- clear separation of simulation, rendering, UI, and data
- tunable systems through externalized configuration values
- scalable update order for future complexity
- easy debugging of bottlenecks, queues, and state transitions
- support for pause, speed changes, and monthly interruption flows

### 28.2 High-Level System Layers
The game should be organized into the following major layers:

#### A. Core Simulation Layer
Responsible for:
- game clock
- simulation tick advancement
- freight generation
- labor processing
- queue management
- pathfinding requests
- storage validation
- KPI calculations
- money, morale, satisfaction, safety, and condition updates

#### B. World / Map Layer
Responsible for:
- 64x64 tile grid state
- tile zoning assignments
- dock door nodes
- travel network representation
- storage capacity by zone
- map-based spatial queries

#### C. Entity / Operational Object Layer
Responsible for:
- trailers
- freight batches
- outbound orders
- labor pools
- contract records
- client profiles
- queue objects

#### D. UI Layer
Responsible for:
- HUD
- zone painting tools
- tooltips
- alerts
- monthly planning dialog
- KPI dashboards
- labor allocation panels

#### E. Presentation Layer
Responsible for:
- isometric rendering
- camera pan and zoom
- visual overlays
- path highlights
- door status indicators
- animation/audio hooks

#### F. Persistence Layer
Responsible for:
- save/load
- settings
- scenario definitions
- balance/config data loading

---

### 28.3 Core Game Objects

#### GameState
Central root object containing current run state.

Suggested responsibilities:
- current date/time
- active speed setting
- paused state
- cash and financial history
- monthly budget settings
- global scores (morale, safety, condition, satisfaction)
- references to map, contracts, labor, freight, queues, and KPI trackers
- current alerts
- current month planning status

#### SimulationClock
Tracks in-game time and tick progression.

Suggested fields:
- current timestamp
- tick length
- speed multiplier
- accumulated real-time delta
- month transition detection

#### WarehouseMap
Represents the 64x64 grid and all tile metadata.

Suggested responsibilities:
- tile definitions
- zone assignment
- dock edge initialization
- door placement
- travel tile graph generation
- storage capacity lookup
- tile validity queries
- distance and path query interface

#### Tile
Suggested fields:
- x, y
- tile type
- zone type
- isDockEdge
- isActiveDoor
- travelAccessible
- storageCapacityContribution
- assignedFreightClassMask
- local condition modifier if needed

#### DoorNode
Represents an active dock door.

Suggested fields:
- door id
- tile position
- door preference type (inbound, outbound, flexible)
- active trailer id
- queue length
- utilization stats
- congestion contribution
- current phase

#### Trailer
Represents a trailer in yard, at door, or completed for departure.

Suggested fields:
- trailer id
- trailer type
- current state
- assigned door id
- arrival time
- yard dwell time
- door dwell time
- freight contents
- direction (inbound or outbound)

#### FreightBatch
Represents grouped freight volume.

Suggested fields:
- batch id
- freight class
- cubic feet
- source trailer id or storage zone id
- destination type
- current state
- contract id
- service priority
- age / elapsed time in system

#### StorageZone
Logical grouping of assigned tiles.

Suggested fields:
- zone id
- zone type
- supported freight classes
- tile list
- total capacity
- used capacity
- valid/invalid state
- nearest travel access summary
- average dock distance summary

#### OutboundOrder
Represents generated outbound demand.

Suggested fields:
- order id
- contract id
- freight requirements
- total cubic feet
- due time
- service priority
- current fulfillment state
- assigned pick queue

#### LaborPool
Represents pooled labor for a function.

Suggested fields:
- labor role
- assigned headcount
- available headcount
- skill rating
- productivity modifier
- fatigue/workload pressure if used later
- hourly cost

#### Contract
Suggested fields:
- contract id
- client profile id
- inbound forecast profile
- outbound forecast profile
- revenue modifier
- satisfaction sensitivity
- service thresholds
- freight class mix weights

#### ClientProfile
Suggested fields:
- profile id
- profile name
- volatility modifier
- service sensitivity
- seasonal pattern id
- freight handling complexity

#### QueueState
Represents operational work queues.

Suggested fields:
- queue id
- queue type
- current workload volume
- item count if needed
- assigned labor role
- average wait time
- backlog severity

#### KPITracker
Responsible for accumulating metrics.

Suggested fields:
- inbound processed this period
- outbound processed this period
- throughput volume
- average dwell times
- utilization metrics
- incident counts
- satisfaction trends
- financial totals

---

### 28.4 Simulation Update Order Per Tick
A consistent update order is critical for predictability and debugging.

Suggested per-tick order:

1. **Advance Clock**
   - update current in-game time
   - detect hour/day/month transitions

2. **Check Monthly Planning Trigger**
   - if first tick of new month, switch to slow speed and pause for planning workflow as needed

3. **Generate Demand and Arrivals**
   - create inbound trailer arrivals based on forecast and stochastic demand logic
   - generate outbound orders based on stored freight and contract demand

4. **Refresh World Validity State**
   - rebuild or validate accessible storage zones if zoning changed
   - refresh travel network caches if map changed
   - recalculate usable storage capacity and invalid zones

5. **Assign Work to Queues**
   - yard trailers enter switch queue
   - docked inbound trailers enter unload queue
   - dock freight enters storage queue
   - eligible inventory enters pick queue
   - picked freight enters load queue
   - completed outbound trailers enter yard departure queue

6. **Process Labor Pools**
   - switch drivers process trailer moves
   - unloaders process inbound dock work
   - storage drivers process putaway
   - pickers process outbound picking
   - loaders process outbound loading
   - sanitation improves warehouse condition
   - management applies support modifiers

7. **Resolve Freight State Transitions**
   - update trailer states
   - update batch states
   - update order states
   - reserve/release storage capacity
   - reserve/release door occupancy

8. **Update Queues and Bottlenecks**
   - recalculate queue sizes, wait times, and congestion pressure

9. **Update Global Scores**
   - morale
   - safety
   - warehouse condition
   - client satisfaction
   - customer satisfaction

10. **Update Financials and KPIs**
    - throughput
    - revenue accrual
    - operating cost accrual
    - utilization
    - dwell times
    - contract performance

11. **Generate Alerts**
    - storage invalid
    - congestion critical
    - morale low
    - safety low
    - satisfaction declining
    - insufficient labor
    - door bottleneck

12. **Push Presentation State**
    - send updated visible state to UI and rendering systems

This order should remain stable and version-controlled because balance and player readability depend on it.

---

### 28.5 Data Structures and Representations

#### Tile Grid Representation
Use a fixed-size 2D array or flat indexed array for performance and simplicity.

Suggested implementation approach:
- `tiles[64][64]` or flattened `tiles[4096]`
- helper functions convert between index and x/y coordinates

Why:
- fast lookup
- simple serialization
- easy iteration for zoning, rendering, and validation

#### Travel Graph Representation
Maintain a graph or adjacency representation derived from travel tiles.

Suggested approach:
- each travel tile is a node or implicit walkable cell
- adjacency defined by orthogonal or diagonal movement rules chosen during implementation
- pathfinding cache invalidated only when travel tiles change

#### Zone Representation
Zones should exist both:
- as per-tile assignments on the map
- as aggregated logical zone objects for capacity and metrics

This dual structure supports both rendering and simulation logic.

#### Queue Representation
Queues can be modeled as workload accumulators rather than literal job-per-box objects in the initial prototype.

Example:
- switch queue measured in trailers waiting
- unload queue measured in cubic feet waiting
- storage queue measured in cubic feet waiting
- pick queue measured in cubic feet waiting
- load queue measured in cubic feet waiting

This keeps the prototype efficient while preserving operational behavior.

---

### 28.6 Pathfinding Responsibilities
Pathfinding should be owned by a dedicated service rather than spread across labor or map objects.

#### PathfindingService
Suggested responsibilities:
- shortest path lookup between source and destination tiles
- validation that destination tiles are reachable through travel network
- distance caching
- invalidation when travel zoning changes
- optional heatmap generation for debugging

Suggested methods:
- `FindPath(startTile, endTile)`
- `GetPathDistance(startTile, endTile)`
- `IsTileOperationallyReachable(tile)`
- `RebuildTravelGraph()`

Prototype optimization suggestion:
- cache shortest distance from each active door to each valid storage zone centroid or access point
- refresh cache only when map zoning changes

---

### 28.7 Storage Validation Workflow
Storage validation should be recalculated whenever the player edits zoning.

Suggested workflow:
1. identify changed tiles
2. rebuild local zone clusters
3. identify supported freight classes by zone type
4. determine whether each storage tile is within 3 tiles of a travel tile
5. determine whether the zone has valid operational access
6. recompute total and available capacity
7. flag invalid zones in UI

This should happen immediately after zone editing rather than every frame.

---

### 28.8 Freight and Order State Machines
Using explicit state machines will make debugging easier.

#### Inbound Freight Batch States
Suggested states:
- queued in yard trailer
- assigned to door
- at door waiting unload
- unloaded to dock
- queued for storage
- stored
- reserved for outbound
- picked
- loaded
- shipped

#### Trailer States
Suggested states:
- waiting in yard
- assigned for move
- moving to door
- at door
- processing
- ready for departure
- moving to yard
- completed

#### Outbound Order States
Suggested states:
- created
- awaiting inventory
- inventory reserved
- queued for pick
- picked to dock
- queued for load
- loaded
- shipped
- late / failed

Explicit states reduce ambiguity and make UI and save/load more reliable.

---

### 28.9 Labor Processing Architecture
Labor should be processed through role-specific worker services or systems, not directly in UI or entity objects.

Suggested systems:
- `SwitchDriverSystem`
- `UnloadSystem`
- `StorageSystem`
- `PickSystem`
- `LoadSystem`
- `SanitationSystem`
- `ManagementSystem`

Each system should:
- read available labor pool values
- read current queue workload
- apply productivity formulas
- consume queue workload
- emit completed work units and side effects

This keeps function behavior modular and easy to rebalance.

---

### 28.10 Financial and KPI Systems
These systems should be centralized so values remain consistent across screens.

#### FinanceSystem
Suggested responsibilities:
- revenue accrual
- payroll cost accrual
- incident penalties
- monthly budget spending
- cash updates
- monthly financial summaries

#### KPIService
Suggested responsibilities:
- throughput tracking
- volume tracking
- dwell time tracking
- utilization tracking
- performance scores
- rolling averages for dashboard display

Use rolling windows where appropriate:
- current hour
- current day
- month to date
- previous month

---

### 28.11 Monthly Planning Architecture
The monthly planning flow should temporarily shift the game into a controlled planning state.

#### PlanningStateController
Suggested responsibilities:
- detect month transition
- switch speed to slow or pause interactive flow
- open planning dialog
- allow the player to reopen planning manually from the HUD at any time
- load current month data snapshot
- queue player budget, labor-assignment, and total-headcount changes for next-tick activation when planning closes
- resume simulation after planning completion

Suggested planning data snapshot:
- current cash
- prior month KPIs
- forecast ranges
- current headcount and labor skill
- warehouse condition summary
- satisfaction summary
- proposed budget allocations
- current labor allocations

This keeps the planning layer separated from the live simulation loop.

---

### 28.12 Rendering and Visual Systems
Rendering should consume simulation state but not modify it.

Suggested rendering responsibilities:
- draw isometric tile map
- render zone overlays by type
- render travel network highlighting
- render dock doors and status icons
- render trailer locations and movement states
- render freight congestion overlays
- render selection/paint previews

Suggested debug overlays:
- valid vs invalid zone overlay
- path distance heatmap
- congestion heatmap
- door utilization labels
- labor bottleneck indicators

These debug layers will be especially useful during tuning.

---

### 28.13 UI Systems Breakdown

#### HUDSystem
Shows always-on operational information:
- time/date
- speed state
- cash
- throughput
- morale
- safety
- condition
- alerts count

#### ZoneEditUI
Handles:
- zone palette
- click-drag painting
- erase/unassign tools
- overlay legend
- validation feedback

#### LaborAllocationUI
Handles:
- headcount assignment by function
- labor shortages or overload indicators
- productivity preview modifiers

#### MonthlyPlanningUI
Handles multi-page modal workflow:
- forecast page
- workforce page
- warehouse condition page
- satisfaction page
- budgeting page
- productivity and labor assignment page

#### AlertUI
Displays:
- warnings
- critical failures
- actionable recommendations

---

### 28.14 Save / Load Model
Save files should capture all simulation-critical state, but not transient rendering-only state.

Suggested save data includes:
- current timestamp
- speed state
- cash and financial totals
- map tile assignments
- zone definitions
- active doors
- current contracts and client profiles in use
- active trailers
- freight batch states
- outbound orders
- labor pools and current allocations
- global scores
- queues and backlog values
- KPI history
- current monthly plan settings
- RNG seed/state if deterministic replay matters

Suggested exclusions:
- camera position unless desired as a convenience
- UI panel open/closed states unless desired
- transient animation values

---

### 28.15 Externalized Configuration and Balance Tables
Balance values should not be hardcoded in simulation logic.

Suggested config tables:
- freight class definitions
- zone type definitions
- labor role base rates
- wage tables
- contract templates
- client profiles
- seasonal demand curves
- difficulty settings
- safety event thresholds
- satisfaction thresholds
- revenue modifiers
- starting mode presets

Suggested file formats:
- JSON for fast prototyping
- CSV or spreadsheets for balancing workflows
- scriptable objects or data assets if using an engine that supports them

---

### 28.16 Event and Alert System
An event system will make the simulation easier to debug and the UI easier to drive.

Suggested event examples:
- month started
- trailer arrived
- trailer assigned to door
- zone invalidated
- queue critical
- safety incident occurred
- satisfaction threshold crossed
- cash below warning threshold
- contract failed threshold

Suggested architecture:
- simulation publishes events
- UI subscribes to display alerts or notifications
- analytics/debug tools subscribe for logging

---

### 28.17 Debugging and Telemetry Tools
This game will benefit heavily from internal diagnostics.

Recommended developer tools:
- queue inspector
- pathfinding visualizer
- zone validity overlay
- storage capacity dashboard
- door utilization monitor
- incident log
- contract performance tracker
- per-system timing metrics
- simulation speed stress test mode

Telemetry should be logged at least by:
- hour
- day
- month

This will help balance the game and locate broken systems quickly.

---

### 28.18 Suggested Code Module Breakdown
A practical initial module structure might be:

- `GameState`
- `SimulationClock`
- `SimulationRunner`
- `WarehouseMap`
- `Tile`
- `ZoneManager`
- `DoorManager`
- `PathfindingService`
- `FreightGenerator`
- `OrderGenerator`
- `QueueManager`
- `LaborManager`
- `SwitchDriverSystem`
- `UnloadSystem`
- `StorageSystem`
- `PickSystem`
- `LoadSystem`
- `SanitationSystem`
- `ManagementSystem`
- `FinanceSystem`
- `KPIService`
- `ConditionSystem`
- `MoraleSystem`
- `SafetySystem`
- `SatisfactionSystem`
- `ContractSystem`
- `PlanningStateController`
- `SaveLoadService`
- `ConfigRepository`
- `AlertSystem`
- `RenderBridge`

This is not mandatory but provides a strong starting decomposition.

---

### 28.19 Prototype Technology Considerations
This GDD does not require a specific engine, but the architecture fits well with:
- Unity
- Godot
- Unreal with a heavier implementation approach
- a custom engine if desired

For a first prototype, the most important requirement is support for:
- grid-based simulation
- isometric rendering
- efficient tile editing
- clear UI workflows
- data-driven configuration

---

### 28.20 Recommended MVP Technical Scope
For the first playable build, the architecture should support only what is needed to validate the game loop.

Recommended MVP technical scope:
- fixed 64x64 map
- tile zoning and travel editing
- active dock doors
- travel path validation
- inbound trailer spawning
- storage and outbound order generation
- labor pools and queue processing
- throughput, revenue, and monthly planning flow
- save/load for a single sandbox run
- debug overlays for congestion, path distance, and zone validity

Anything beyond this should be treated as phase-two unless it is essential to proving the core fun.

---

## 29. MVP Feature Scope & Development Milestones

This section defines the minimum viable product, the content intentionally excluded from the first playable version, and a recommended milestone-based development plan.

### 29.1 MVP Goal
The MVP should prove that the core game loop is fun, understandable, and technically stable.

The MVP must validate that players can:
- build a workable warehouse layout
- assign travel and storage zones
- process inbound and outbound freight
- allocate labor effectively
- respond to bottlenecks and congestion
- earn money through throughput
- engage with the monthly planning loop

If the MVP successfully demonstrates these outcomes, the project has a strong foundation for expansion.

---

### 29.2 MVP Feature Scope
The MVP should include only the features necessary to validate the core operational simulation.

#### Included in MVP

##### A. Core Map and Camera
- fixed **64x64 warehouse grid**
- **isometric view**
- camera **pan**
- camera **zoom**
- visible tile grid and overlays

##### B. Core Tile Types
- auto-assigned **outer dock edge**
- **travel tiles**
- **unassigned tiles**
- at least **3 storage zone types** in the first prototype build, expandable to 5 freight-compatible classes shortly after

##### C. Zone Editing
- click-drag zone painting
- erase / unassign tool
- travel tile painting
- invalid tile / invalid zone feedback
- storage validity based on travel adjacency and path access

##### D. Dock and Door Operations
- **16 active dock doors**
- inbound-preferred, outbound-preferred, and flexible door behavior
- visible door status
- door queue tracking

##### E. Freight Simulation
- inbound trailer spawning
- multiple freight classes
- cubic-foot-based storage capacity
- freight compatibility by zone type
- stored freight inventory state
- outbound order generation from stored freight

##### F. Labor Simulation
- pooled labor by function
- switch drivers
- unloaders
- storage drivers
- pickers
- loaders
- sanitation
- management
- labor allocation interface

##### G. Queue and Flow Simulation
- yard queue
- unload queue
- storage queue
- pick queue
- load queue
- departure queue
- visible operational bottlenecks

##### H. Economy and KPIs
- throughput calculation
- revenue accrual
- monthly operating costs
- cash tracking
- KPI display for inbound, outbound, throughput, safety, morale, condition, and satisfaction

##### I. Monthly Planning Flow
- monthly trigger at beginning of month
- speed automatically set to slow
- multi-page planning dialog
- forecast view
- labor/workforce summary
- warehouse condition summary
- satisfaction summary
- budget allocation page
- productivity and labor assignment page

##### J. Core Secondary Systems
- morale
- warehouse condition
- safety score
- client satisfaction
- customer satisfaction
- congestion system

##### K. Persistence and Debugging
- save/load for a single run
- key debug overlays
- alert system
- tuning through config files

---

### 29.3 Explicitly Out of Scope for MVP
The following features should be deferred unless they become essential during prototype validation:
- named individual workers
- advanced weather effects
- external transportation network simulation
- equipment maintenance at individual vehicle level
- direct control of forklifts or drivers
- campaign mode
- story content
- warehouse expansion / multiple facility ownership
- multiplayer
- achievements / meta progression
- deep contract negotiation screens
- advanced compliance auditing systems
- highly detailed safety incident narratives
- automation technologies such as conveyors or autonomous vehicles
- detailed SKU-level inventory modeling

Deferring these protects schedule and ensures focus on the core simulation loop.

---

### 29.4 MVP Quality Bar
Before moving beyond MVP, the first playable build should meet the following quality bar:
- player can understand zone rules without external explanation
- labor allocation changes clearly affect operational outcomes
- bottlenecks are visible and diagnosable
- throughput earnings feel tied to player decisions
- monthly planning feels meaningful, not cosmetic
- the simulation can run for multiple in-game months without breaking down technically
- performance remains stable at all speed settings
- save/load preserves key operational state correctly

---

### 29.5 Milestone Structure Overview
Recommended milestone sequence:
1. Pre-Production and Simulation Spec Lock
2. Core Map and Zoning Prototype
3. Freight Flow Prototype
4. Labor and Queue Simulation Prototype
5. Monthly Planning and Economy Integration
6. UI/UX Stabilization and Debugging
7. MVP Content Lock and Playtest Build

Each milestone should end with a playable internal checkpoint.

---

### 29.6 Milestone 1: Pre-Production and Simulation Spec Lock
**Goal:** finalize baseline rules and prepare engineering foundations.

#### Deliverables
- finalized GDD baseline
- finalized core formulas
- data schema for tiles, zones, freight, labor, doors, contracts, and queues
- config table structure for tuning
- visual target references for map and UI direction
- technical spike decisions on engine/framework

#### Exit Criteria
- no unresolved questions that block prototype coding
- engineering agrees on simulation update order
- data-driven config structure is defined

---

### 29.7 Milestone 2: Core Map and Zoning Prototype
**Goal:** create the playable warehouse layout layer.

#### Deliverables
- 64x64 isometric map rendering
- camera pan and zoom
- outer dock edge auto-generation
- travel tile painting
- storage zone painting
- zone erase tool
- zone validity feedback
- travel adjacency rule enforcement
- basic pathfinding service

#### Exit Criteria
- player can paint and edit zones fluidly
- invalid storage is correctly identified
- pathfinding returns consistent results on travel tiles
- door nodes can be placed and read by simulation systems

---

### 29.8 Milestone 3: Freight Flow Prototype
**Goal:** prove inbound and outbound freight movement loop.

#### Deliverables
- inbound trailer spawning
- trailer yard state
- door assignment logic
- trailer movement state handling
- unload to dock process
- storage assignment process
- stored freight inventory tracking
- outbound order generation
- picking and loading flow
- shipment completion state

#### Exit Criteria
- freight can complete full inbound-to-outbound lifecycle
- storage compatibility rules work
- throughput can be measured reliably
- trailer dwell and door dwell can be tracked

---

### 29.9 Milestone 4: Labor and Queue Simulation Prototype
**Goal:** make the warehouse feel operationally alive through capacity limits and bottlenecks.

#### Deliverables
- labor pools by function
- queue creation and processing logic
- workload accumulation and backlog behavior
- congestion calculations
- management support modifiers
- sanitation effect on condition
- visible queue metrics

#### Exit Criteria
- understaffing creates visible bottlenecks
- reallocating labor changes outcomes in understandable ways
- congestion emerges naturally from poor layouts and overload
- queue stress produces meaningful operational pressure

---

### 29.10 Milestone 5: Monthly Planning and Economy Integration
**Goal:** connect strategic monthly planning with real-time operations.

#### Deliverables
- running game clock with month transition detection
- monthly planning dialog framework
- forecast generation by difficulty
- budgeting controls
- labor allocation controls in planning screen
- revenue, cost, and cash systems
- KPI dashboard and month-to-date metrics
- morale, safety, condition, and satisfaction updates

#### Exit Criteria
- player decisions in monthly planning materially affect the following month
- cash flow and throughput relationship is understandable
- budgeting tradeoffs produce visible gameplay consequences
- simulation survives month rollover cleanly

---

### 29.11 Milestone 6: UI/UX Stabilization and Debugging
**Goal:** make the game readable, playable, and debuggable.

#### Deliverables
- improved HUD layout
- alerts and warning system
- tooltips and contextual information
- door status display
- congestion overlays
- path distance and validity overlays
- queue inspector
- KPI charts or trend summaries
- debug logging and telemetry tools

#### Exit Criteria
- testers can identify why operations are failing
- alerts are actionable rather than noisy
- important metrics are visible without opening too many panels
- internal team can debug balance issues efficiently

---

### 29.12 Milestone 7: MVP Content Lock and Playtest Build
**Goal:** produce a stable internal build suitable for structured playtesting.

#### Deliverables
- difficulty modes connected to forecast variation and starting cash
- initial freight class set finalized
- baseline contract/client profile set
- tuned starting values for morale, safety, condition, and skill
- save/load stability pass
- balancing pass for throughput, labor costs, and queue behavior
- bug fixing and performance optimization

#### Exit Criteria
- internal playtesters can complete multiple months of play
- no critical blockers in saving, loading, planning, or queue progression
- at least one difficulty feels approachable and one feels demanding
- the team can confidently answer whether the game is fun enough to continue

---

### 29.13 Recommended Playtest Questions for MVP
The first structured playtests should answer:
- Do players understand the purpose of travel tiles and storage zoning?
- Do players notice and respond to bottlenecks effectively?
- Does monthly planning feel useful or interruptive?
- Are labor roles distinct enough to create interesting decisions?
- Does the throughput economy feel rewarding?
- Is the game readable at medium and fast speed?
- Are morale, safety, and condition meaningful without being overwhelming?
- Is difficulty scaling fair?

These questions should guide iteration after MVP build completion.

---

### 29.14 Post-MVP Expansion Priorities
If the MVP validates successfully, the next recommended expansion order is:
1. additional freight classes and zone specialization
2. richer contract and client variety
3. more advanced warehouse layouts or map generation
4. equipment systems and operational upgrades
5. deeper workforce systems
6. campaign/scenario structure
7. automation and advanced logistics features

This order expands depth without undermining the established core loop.

---

### 29.15 Production Risks to Watch
The team should monitor the following risks during MVP development:
- simulation complexity outruns UI readability
- queue logic becomes too abstract to feel satisfying
- zoning rules become confusing or too punishing
- monthly planning becomes spreadsheet-like rather than strategic
- labor roles feel redundant
- contract and forecast systems create noise instead of interesting planning
- performance drops at higher speeds
- save/load state integrity becomes difficult as systems grow

These should be reviewed at each milestone checkpoint.

---

### 29.16 Recommended MVP Success Criteria
The MVP should be considered successful if it demonstrates:
- a fun and legible inbound/outbound warehouse loop
- meaningful spatial layout decisions
- meaningful labor allocation decisions
- a visible relationship between congestion, condition, morale, and throughput
- strategic monthly planning with operational consequences
- enough depth to justify further production investment

---

## 30. UI/UX Wireframe Specification

This section defines the intended screen structure, layout priorities, and interaction model for the MVP user experience. The goal is to make a fairly complex warehouse simulation readable, actionable, and satisfying to operate.

### 30.1 UI/UX Design Goals
The UI/UX should prioritize:
- immediate readability of warehouse state
- fast diagnosis of bottlenecks
- low-friction zone editing
- clear distinction between strategic monthly planning and live operational play
- minimal player confusion about why something is failing
- support for both quick scanning and deep drill-down

Core principle:
**The player should almost always be able to answer three questions quickly:**
1. What is happening right now?
2. What is going wrong?
3. What action can I take to improve it?

---

### 30.2 Primary Screen Set
The MVP should include the following primary interface layers:
- Main Gameplay Screen
- Top HUD
- Left Tool Panel / Build & Zone Palette
- Right Operations Panel / Detail Panel
- Bottom KPI Strip or Context Bar
- Monthly Planning Dialog
- Alerts Center
- Tooltip System
- Debug Overlay Panel (developer/testing use)

---

### 30.3 Main Gameplay Screen
The Main Gameplay Screen is the default operational view.

#### Layout Intent
- center: isometric warehouse map
- top: always-visible HUD
- left: zone editing and map tools
- right: selected object details / operations summary
- bottom: KPI strip and contextual status

#### Main View Priorities
The map must visually communicate:
- dock edge
- active doors
- travel tiles
- zone assignments
- invalid zones
- congestion hotspots
- trailer states
- major freight flow bottlenecks

#### Interaction Model
Player can:
- pan camera by mouse drag or keyboard
- zoom camera by wheel or keybinds
- click tiles to inspect
- click-drag to paint zones
- click doors, queues, or alerts to focus problem areas
- change speed at all times except during modal planning states

---

### 30.4 Main Gameplay Screen Wireframe
Suggested layout concept:

```text
+----------------------------------------------------------------------------------+
| Time/Date | Speed | Cash | Throughput | Morale | Safety | Condition | Alerts      |
+----------------------------------------------------------------------------------+
| Tools / Zones         |                                                      |   |
| - Select              |                                                      | O |
| - Travel              |                Isometric Warehouse Map               | p |
| - Standard Storage    |                                                      | e |
| - Bulk Storage        |                                                      | r |
| - Fast-Turn Storage   |                                                      | a |
| - Special Handling    |                                                      | t |
| - Erase               |                                                      | i |
|                       |                                                      | o |
|                       |                                                      | n |
|                       |                                                      | s |
|                       |                                                      |   |
+----------------------------------------------------------------------------------+
| KPI Bar: Inbound | Outbound | Yard Queue | Dock Queue | Pick Queue | Load Queue |
+----------------------------------------------------------------------------------+
```

This wireframe is conceptual and should guide hierarchy rather than exact sizing.

---

### 30.5 Top HUD Specification
The HUD must surface the most important always-on information.

#### Required HUD Elements
- current date
- current in-game time
- current speed setting
- pause/play controls
- cash on hand
- throughput volume (current day and/or month-to-date)
- morale score
- safety score
- warehouse condition score
- alert count or alert severity indicator

#### Optional Secondary Indicators
- client satisfaction
- customer satisfaction
- current month forecast progress
- profitability trend arrow

#### UX Rules
- use color and iconography to indicate good / warning / critical states
- never rely on color alone; include text or icon cues
- critical alerts should pulse or animate lightly, not aggressively
- hovering a HUD metric should explain what is affecting it

---

### 30.6 Speed Controls
Speed control is central to the game’s pacing.

#### Required Buttons
- Pause
- Slow
- Medium
- Fast

#### UX Behavior
- active speed is clearly highlighted
- switching speed gives immediate visual feedback
- at month start, speed automatically shifts to Slow before planning dialog opens
- player should understand when speed is locked by a modal state

---

### 30.7 Left Tool Panel / Zone Palette
The left panel is the main build and zone editing tool area.

#### Core Tools
- Select / Inspect
- Travel Paint
- Standard Storage Paint
- Bulk Storage Paint
- Fast-Turn Storage Paint
- Special Handling Paint
- Erase / Unassign

#### Optional Controls
- brush size selector
- fill/paint rectangle mode later
- overlay toggle shortcuts

#### UX Rules
- active tool must be obvious
- tooltips must explain zone purpose and compatibility
- invalid painting results should preview before commit where possible
- panel should collapse or minimize during observation-heavy play

#### Example Tool Card Format
Each zone type should show:
- icon
- name
- supported freight classes
- capacity style
- any movement or service modifiers

---

### 30.8 Zone Painting UX
Zone painting needs to feel fast and predictable.

#### Interaction Rules
- click-drag paints contiguous selected area
- painting over existing zone reassigns tiles
- erase removes zone assignment back to unassigned
- travel tiles are painted similarly to zones
- invalid zones should be visually marked immediately after paint action

#### Visual Feedback
- hovered tile highlight
- drag selection preview
- invalid tile outline or hatch overlay
- path access feedback when travel connectivity changes

#### Error Prevention
When possible, the UI should explain invalid states directly, such as:
- “No travel access”
- “Too far from travel tile”
- “Unsupported freight class”
- “No door-accessible route”

---

### 30.9 Right Operations Panel / Detail Panel
The right panel provides deeper inspection and contextual actions.

#### Default Panel Tabs
- Overview
- Selected Tile / Zone
- Doors
- Labor
- Queues
- Contracts
- Warehouse Health

#### Overview Tab
Shows quick operational snapshot:
- active bottlenecks
- current queue pressures
- top warnings
- current throughput trend
- storage utilization

#### Selected Tile / Zone Tab
When a tile or zone is selected, show:
- tile coordinates or zone id
- zone type
- valid/invalid state
- assigned freight compatibility
- current capacity / used capacity
- nearest travel access
- average distance to nearest door
- reason invalid if unusable

#### Doors Tab
Shows all active doors with:
- door id
- inbound/outbound/flexible designation
- active trailer state
- queue length
- utilization
- congestion severity

#### Labor Tab
Shows:
- labor by role
- assigned headcount
- available headcount
- productivity modifiers
- overload warnings

#### Queues Tab
Shows:
- queue sizes
- wait times
- blocking dependencies
- bottleneck ranking

---

### 30.10 Bottom KPI Strip / Context Bar
The bottom bar should provide fast operational scanning without opening deeper menus.

#### Required KPI Items
- inbound volume processed
- outbound volume processed
- throughput volume
- yard queue size
- dock unload queue size
- storage queue size
- pick queue size
- load queue size
- current contract performance snapshot

#### Contextual Behavior
- clicking a KPI focuses relevant issue area on the map or right panel
- hovering a KPI shows short explanation and trend
- critical KPI items should visually escalate when thresholds are crossed

---

### 30.11 Alerts Center
Alerts must help the player act, not simply warn them.

#### Alert Types
- informational
- warning
- critical

#### Example Alerts
- no valid storage for freight class
- yard trailer backlog growing
- door utilization critical
- morale falling
- safety declining
- customer satisfaction dropping
- maintenance under target
- congestion severe in storage area

#### Alert Center Behavior
- alerts collected in one panel or dropdown
- sortable by severity and category
- clicking an alert focuses map or opens relevant panel
- repeated alerts should stack instead of spamming duplicates

#### Good Alert Format
Each alert should contain:
- severity icon
- short title
- one-line explanation
- recommended action

Example:
- **Critical: No Valid Bulk Storage**
- “Inbound bulk freight cannot be put away.”
- “Assign more bulk-compatible space near travel lanes.”

---

### 30.12 Tooltip System
Tooltips are essential for teaching the player the simulation.

#### Tooltip Use Cases
- HUD metric explanation
- zone purpose and modifiers
- tile validity reason
- door status explanation
- queue pressure meaning
- morale, safety, and condition explanations

#### Tooltip Rules
- short by default
- expandable for deeper explanation if needed
- always include cause-and-effect when possible

Example:
- **Congestion: 78 (High)**
- “Congestion is reducing movement speed and increasing incident risk.”
- “Main causes: high storage assignment, door overuse, pick backlog.”

---

### 30.13 Monthly Planning Dialog
This is the main strategic screen and should feel distinct from live operations.

#### UX Goals
- slower, more deliberate decision making
- clear summary of prior month and upcoming month
- easy comparison of current values vs projected changes
- all important business levers in one place

#### Layout Intent
- large modal or full-screen overlay
- left sidebar or top tabs for page navigation
- central content page
- right summary or bottom sticky action area

#### Required Pages
- Forecast
- Workforce
- Warehouse Condition
- Satisfaction
- Budgeting
- Productivity & Labor Assignment

---

### 30.14 Monthly Planning Dialog Wireframe
Suggested layout concept:

```text
+----------------------------------------------------------------------------------+
| Monthly Planning - Month / Year                                                  |
+----------------------+-----------------------------------------------------------+
| Forecast             | Page Content Area                                         |
| Workforce            |                                                           |
| Warehouse Condition  |   Charts, summaries, sliders, tables, recommendations     |
| Satisfaction         |                                                           |
| Budgeting            |                                                           |
| Productivity/Labor   |                                                           |
+----------------------+-----------------------------------------------------------+
| Summary: Forecast Risk | Cash | Planned Budget | Expected Pressure | Confirm Plan |
+----------------------------------------------------------------------------------+
```

---

### 30.15 Forecast Page Specification
The Forecast page should answer: what demand is expected next month?

#### Required Content
- forecast inbound volume
- forecast outbound volume
- forecast range / confidence band
- freight class mix breakdown
- expected peak periods
- contract-driven demand highlights

#### Preferred Visuals
- line chart or bar chart for weekly volume profile
- class mix stacked bar or pie-like breakdown
- volatility indicator

#### Decision Support
The page should also suggest:
- likely labor pressure areas
- likely storage pressure areas
- whether the forecast is more or less reliable than last month

---

### 30.16 Workforce Page Specification
The Workforce page should answer: do we have the people and capability to execute?

#### Required Content
- total headcount
- role-by-role staffing
- morale / engagement
- overall skill
- skill gaps by role
- labor stress or overload flags

#### Recommended Visuals
- headcount by role table
- morale and skill bars
- staffing deficit warnings

#### Actions
- adjust staffing budget or headcount targets
- review likely understaffed functions

---

### 30.17 Warehouse Condition Page Specification
The Warehouse Condition page should answer: can the facility handle the work?

#### Required Content
- total storage space
- assigned vs unassigned space
- valid vs invalid assigned space
- cleanliness
- maintenance backlog
- congestion risk outlook
- zone utilization summary

#### Recommended Visuals
- assigned/unassigned bar
- condition score trend
- utilization by zone type
- warning list for invalid or overused areas

---

### 30.18 Satisfaction Page Specification
The Satisfaction page should answer: how is service quality trending?

#### Required Content
- client satisfaction score
- customer satisfaction score
- recent trend direction
- top positive and negative drivers
- service failures or contract risks

#### Recommended Visuals
- trend chart
- driver breakdown list
- contract health indicators

---

### 30.19 Budgeting Page Specification
The Budgeting page should be one of the most interactive and important planning pages.

#### Required Budget Categories
- payroll / headcount
- maintenance
- labor task support / operations
- workforce training
- safety

#### Core Controls
- sliders, steppers, or editable numeric fields
- projected effect preview where possible
- total budget summary
- over-budget or underfunded warnings

#### UX Rules
- show projected tradeoffs clearly
- avoid hiding major consequences
- changing a budget should preview major affected systems

Example preview note:
- “Reducing maintenance may increase available cash now, but will raise congestion wear and safety risk next month.”

---

### 30.20 Productivity & Labor Assignment Page Specification
This page should connect strategy to operations most directly.

#### Required Content
- prior month inbound volume
- prior month outbound volume
- prior month throughput volume
- safety summary
- labor assignment by operational function

#### Required Actions
- assign headcount to inbound unloading
- assign headcount to inbound storage
- assign headcount to outbound picking
- assign headcount to outbound loading
- assign headcount to trailer movement
- assign headcount to sanitation
- assign headcount to management

#### Recommended UX
- use steppers/sliders for role allocation
- show projected pressure or capacity indicators next to each function
- highlight functions expected to be under pressure next month

---

### 30.21 Modal and Panel Behavior Rules
The UI should clearly distinguish between:
- live simulation panels
- modal decision screens
- passive information overlays

#### Rules
- live HUD remains visible in operations mode
- planning dialog blocks simulation-changing input until confirmed or closed
- a `Plan` button in the right HUD Business section can reopen the planning dialog during normal operations
- when the player closes planning with applied changes, those changes become authoritative on the next simulation tick rather than immediately on modal close
- alerts can be opened without fully obscuring the map
- tooltips should never block important click targets
- secondary panels should be collapsible when not in use

---

### 30.22 Color and Status Language
The interface should use consistent status language.

#### Suggested Status Labels
- Healthy
- Stable
- Busy
- Strained
- Critical

#### Suggested Score Bands
- 80–100 = Healthy
- 60–79 = Stable/Warning boundary
- 40–59 = Strained
- 0–39 = Critical

#### Accessibility Rule
Use icons, text labels, and patterns in addition to color.

---

### 30.23 Visual Overlay Set
Overlays are important for diagnosing warehouse problems.

#### Recommended Overlays
- zone type overlay
- travel network overlay
- valid vs invalid storage overlay
- congestion heatmap
- path distance heatmap
- door utilization overlay
- queue pressure overlay
- satisfaction issue overlay later if needed

#### UX Rules
- overlays should be toggleable individually
- one overlay may be set as primary while others remain subtle
- player should not need overlays for basic understanding, but overlays should enhance diagnosis

---

### 30.24 Input and Interaction Mapping
Suggested control scheme:

#### Mouse
- left click = select
- left click drag = paint with active tool
- right click drag or middle drag = pan camera
- mouse wheel = zoom

#### Keyboard
- space = pause / unpause
- 1 = slow
- 2 = medium
- 3 = fast
- Q/E or equivalent = rotate view later if supported
- tab = cycle major panels
- esc = close panel / cancel tool / close modal step if safe

These should remain customizable in a later settings phase.

---

### 30.25 Empty State and Teaching UX
Because this is a systems-heavy sim, the game must teach itself well.

#### Early Game Guidance Recommendations
- first-time hints for travel tile requirement
- first-time hints for storage compatibility
- explanation when outbound orders cannot generate
- explanation when freight is stuck at dock
- explanation for monthly planning pages on first opening

#### Empty State Examples
- “No valid storage zones assigned yet.”
- “No outbound inventory available yet.”
- “No labor assigned to switch drivers.”

These messages should be helpful, not punitive.

---

### 30.26 Debug / Developer UI Specification
For internal development builds, include dedicated debug panels.

#### Recommended Debug Views
- pathfinding distances
- queue internals
- labor processing rates
- modifier breakdowns by function
- incident probability breakdown
- contract and satisfaction calculations
- simulation tick timing

This developer UI may be hidden in retail builds but is essential during balancing.

---

### 30.27 UI/UX Validation Questions
During testing, the team should verify:
- Can players identify the current bottleneck within a few seconds?
- Do players understand why a zone is invalid?
- Can players tell which labor role is overloaded?
- Are the monthly planning pages informative without being overwhelming?
- Can players connect budget changes to operational results?
- Does the HUD surface enough information without clutter?
- Are alerts actionable and specific?
- Is the game readable at fast speed?

---

### 30.28 UI/UX Success Criteria
The UI/UX should be considered successful when:
- the player can run the warehouse mostly from the main gameplay screen
- deeper panels add insight rather than essential hidden information
- failures feel explainable
- alerts lead naturally to corrective action
- monthly planning feels strategic rather than administrative
- complexity feels deep, not confusing

---

## 31. Summary

*FreightFlow* is a warehouse logistics simulation built around spatial planning, labor allocation, and throughput optimization. Players design the operational layout of a 64x64 isometric warehouse, create valid travel-connected storage zones, respond to dynamic inbound and outbound freight demand, and manage the financial and human consequences of their decisions.

Its defining loop combines:
- real-time freight movement,
- monthly business planning,
- throughput-based earnings,
- and layered management of labor, condition, satisfaction, and capacity.

The result should feel like a deep but readable warehouse operations simulator where layout, staffing, and strategic planning all matter.
