# neon harbor overnight remake plan

rules for this run: no questions, no comments in code, lowercase short commits, push after every phase, never leave the game broken (syntax check + browser reload + console check before every commit).

## already done
- [x] rtx mode (shadows, ao, bloom, aces, msaa)
- [x] trees (blender), grass tiles with wind, leaf sway
- [x] city buildings generator (massing, facades, storefronts, props)
- [x] city prop kit, street kit (lamps, mast arm signals, hydrants, benches, meters, shelters)
- [x] cars (4 bodies + police) in blender
- [x] player + pedestrians: skinned human, real gait
- [x] ground detail shader, phong facades

## phase 1 - finish the world (everything still low poly)
- [ ] 1a linden heights: blender house kit (colonial, ranch, cape, split level, garages, porches, chimneys, dormers) + generator replacing the box houses
- [ ] 1b southgate: run the building generator on mall, towers, apartments, townhouses, big box, garage, boardwalk
- [ ] 1c millbrook: barn, silo, farmhouse, windmill, tractor, fences, haybales, crops with real plants
- [ ] 1d northshore + ocean: pier, boats, lighthouse, water shader with waves, foam, reflections
- [ ] 1e roads and sidewalks: real curb geometry with matching physics height, road wear decals, manholes, drains, crosswalk wear, lane arrows, parking lines
- [ ] 1f perimeter fence, harbor props (containers, cranes, bollards, ships), park details (benches, paths, ponds, playground)

## phase 2 - sky, light, weather
- [ ] 2a sky shader: sun disc, rayleigh/mie gradient, procedural clouds that move, stars, moon phases
- [ ] 2b light: real time of day color grading, window and street light pools, headlight spotlights with cones, car taillight glow
- [ ] 2c weather: rain with splashes and wet road reflections, fog banks, storms, wind driving grass and trees and flags
- [ ] 2d post: soft vignette, subtle film grain, lens flare on sun and neon, tone mapping tuned per quality tier

## phase 3 - vehicles
- [ ] 3a wheels as separate parts that spin and steer, suspension body roll and pitch, brake lights, indicators, reverse lights
- [ ] 3b new physics model: tire grip curve, handbrake drift, weight transfer, per class handling (sedan, hatch, suv, coupe, van, truck, bus, taxi, police, motorbike)
- [ ] 3c new vehicle models: van, box truck, bus, taxi, motorbike, ambulance, firetruck
- [ ] 3d damage: panel deformation, hood pop, glass breaking, smoke and fire stages, wheels coming loose
- [ ] 3e traffic ai: lane changes, turns at junctions, yielding, honking, pedestrians crossing at lights, emergency vehicles pulling over

## phase 4 - on foot
- [ ] 4a character controller: stamina sprint, jump and vault, ladder, swim animation, fall damage, slopes
- [ ] 4b animation set: enter and exit car, driving poses, aim, shoot, reload, melee, hit reaction, death, ragdoll, gestures
- [ ] 4c npc behavior: daily routines, groups talking, phone use, reacting to gunshots and crashes, fleeing, police witness system

## phase 5 - combat and law
- [ ] 5a weapon models in blender (pistol, revolver, smg, shotgun, rifle, bat, knife) with muzzle flash, shell ejection, recoil, reload anims
- [ ] 5b ballistics, cover, hit zones, armor
- [ ] 5c wanted system rework: witness, line of sight search, foot cops, cruisers, roadblocks, swat van, helicopter, k9, bribery, hideouts
- [ ] 5d gangs: territories, rival drive bys, turf missions

## phase 6 - missions and world content
- [ ] 6a mission framework (data driven): types (deliver, chase, escort, steal, race, assassinate, heist, tail)
- [ ] 6b rework story chapters with cutscene camera work, voiced-style subtitles and branching
- [ ] 6c side activities: taxi, pizza, courier, street races, stunt jumps, hidden packages, photo, fishing, golf
- [ ] 6d economy: shops (clothes, barber, car mod garage, guns), properties, safehouses, phone with contacts

## phase 7 - ui, audio, systems
- [ ] 7a hud redesign (minimap with styled map, radial weapon wheel, notifications, phone ui)
- [ ] 7b menus: pause, map with waypoints, stats, settings (graphics tiers, controls rebinding, gamepad)
- [ ] 7c gamepad + touch controls
- [ ] 7d audio: layered engine sims per car, tire squeal, footsteps by surface, ambience per district, radio stations with procedural music, dynamic mixing
- [ ] 7e save system v2 with multiple slots and migration

## phase 8 - performance and quality
- [ ] 8a lod for people, cars, buildings, trees; frustum culling for merged meshes via chunks
- [ ] 8b instancing audit, texture atlas, draco/meshopt compression of the glbs
- [ ] 8c quality tiers (low, medium, high, rtx) auto detect
- [ ] 8d load screen with progress, deferred asset loading

## phase 9 - polish
- [ ] 9a bug sweep, console clean, mobile layout pass
- [ ] 9b readme, tools docs, credits (poly haven cc0)
- [ ] 9c final screenshots

status log is at the bottom, updated after each phase.

## status log
