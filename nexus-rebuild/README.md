# KOZAK NEXUS — Living World prototype

Separate TypeScript + Phaser 3 rebuild. The current production app remains untouched on `main`.

## Current playable slice
- Medieval valley map with forests, water, settlement, wildlife and villagers.
- Autonomous population movement and basic food/wood economy.
- Build houses, farms, fire station and research center.
- Random forest fires spread; firefighter station/crew can extinguish nearby fires.
- Year/era progression, population growth, research milestones and local autosave.
- Speed controls, manual save and reset.

## Run
`npm install` → `npm run dev`
`npm run build` creates the static site in `dist/`.

## Planned simulation layers
1. Larger streamed world and distinct biomes/sectors.
2. Citizen professions, needs, families, pathfinding and autonomous construction.
3. Hunting, livestock, farming seasons, storage and trade.
4. Fire ecology, weather, fire brigades, emergency response and rebuilding.
5. Era technology tree: medieval → renaissance → industrial → modern → future.
6. Expeditions, discoveries, diplomacy, conflicts and world chronology.
7. Shared KOZAK NEXUS profile/rewards integration through a versioned local-save adapter.
