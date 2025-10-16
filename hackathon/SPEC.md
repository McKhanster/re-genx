## **RE-GENX**

- A community-driven creature evolution simulator where players collectively vote on mutations, traits, and environmental challenges for a shared creature/ecosystem.

**Note:** This is the latest specification that supersedes the original Genesis MVP spec. Re-GenX focuses on community-wide evolution rather than small 25-player groups.

## 🧬 Mutation System Design

### **What Causes Mutations?**

**1. Generational Posts (Time-Based)**

- Every 8-12 hours, a new "Generation Post" appears
- Each generation = opportunity for 1-3 mutations
- Creates anticipation and recurring engagement

**2. Environmental Challenges (Event-Driven)**

- Random events: "Ice Age Approaching," "Predator Invasion," "Food Scarcity"
- Community must adapt the creature or face consequences
- Failed adaptations = population decline (visible stat)

**3. Milestone Unlocks (Achievement-Based)**

- Population reaches 1000 → unlock "Complex Organs"
- Survive 50 generations → unlock "Social Behaviors"
- Defeat a predator → unlock "Defensive Traits"

**4. Community Resources (Player-Driven)**

- Players earn "Evolution Points" by participating (voting, commenting)
- Spend points to propose custom mutations
- Most upvoted custom mutations enter the vote pool

---

### **How Does a Creature Mutate?**

## **Phase 1: Proposal Phase** (First 2-4 hours of generation)

Players see:

- **Current Creature Stats** (illustrated sprite + stat bars)
- **Environmental Challenge** (if any): "Temperature dropping 15°C"
- **Available Mutation Slots**: 2-3 slots this generation

**3 Ways to Add Mutations to Ballot:**

1. **System-Generated Options** (always 5-8 choices)

   - Contextually relevant to current challenges
   - Example: During Ice Age → "Thick Fur," "Hibernation," "Migration Instinct"

2. **Player Proposals** (costs Evolution Points)

   - Players submit custom mutation ideas
   - Must specify: Name, Type, Trade-off
   - Example: "Echolocation: +20 Hunting, -10 Speed, -5 Vision"

3. **Mutation Lab** (special mechanic)
   - Combine two existing traits to create new ones
   - Example: "Sharp Claws" + "Venomous Bite" = "Toxic Talons"

## **Phase 2: Voting Phase** (Next 3-4 hours)

**Ballot shows:**

```
┌─────────────────────────────────────┐
│ GENERATION 23 - VOTE NOW!          │
│ Challenge: Predator Invasion        │
│                                     │
│ SLOT 1: Defensive Trait             │
│ 🦔 Spiky Armor     [▓▓▓░░] 1,243   │
│ 🏃 Speed Burst     [▓░░░░]   421   │
│ 🎭 Camouflage      [▓▓░░░]   892   │
│ 💀 Play Dead       [▓░░░░]   301   │
│                                     │
│ SLOT 2: Sensory Enhancement         │
│ 👁️ 360° Vision    [▓▓▓▓░] 1,621   │
│ 👃 Scent Tracking  [▓▓░░░]   743   │
│ 📡 Danger Sense    [▓░░░░]   402   │
│                                     │
│ SLOT 3: Community Proposal          │
│ 🧠 Pack Tactics    [▓▓▓░░] 1,104   │
│     (proposed by u/EvoDev42)        │
│ ⚡ Bioluminescence [▓▓░░░]   856   │
│     (proposed by u/glowworm)        │
└─────────────────────────────────────┘
```

**Voting Mechanics:**

- Each user gets 1 vote per slot
- Can change vote during voting window
- Vote weight increases based on account age (anti-cheat)
- Top vote in each slot wins

## **Phase 3: Resolution Phase** (Instant after voting closes)

**The Reveal:**

- Animated sprite updates showing new traits
- Stat changes displayed with +/- indicators
- Challenge outcome: "SURVIVED! Population +150"
- Hall of Fame: Players who proposed winning mutations

---

### **Creature Anatomy System**

**Core Stat Categories:**

```
🏃 MOBILITY
├─ Speed (0-100)
├─ Agility (0-100)
└─ Endurance (0-100)

🎯 SENSES
├─ Vision (0-100)
├─ Hearing (0-100)
└─ Smell (0-100)

⚔️ SURVIVAL
├─ Attack (0-100)
├─ Defense (0-100)
└─ Stealth (0-100)

🧠 COGNITION
├─ Intelligence (0-100)
├─ Social (0-100)
└─ Adaptability (0-100)

💚 VITALS
├─ Health (0-100)
├─ Population (special: 0-10,000)
└─ Mutation Rate (0-100)
```

**Trade-off System:**
Every mutation has costs:

- "Giant Size": +40 Attack, +30 Defense, -25 Speed, -20 Agility, 2x Food Requirement
- "Photosynthesis": -50 Food Need, +30 Health, -40 Speed, requires sunlight
- "Hive Mind": +50 Social, +40 Intelligence, -20 Individuality (new mechanic)

---

### **Types of Mutations**

**1. Physical Mutations** (visible on sprite)

- Limbs: Wings, Extra Arms, Fins, Tentacles
- Defense: Shells, Armor Plates, Spikes, Thick Hide
- Attack: Claws, Horns, Fangs, Stingers
- Size: Gigantism, Miniaturization
- Special: Bioluminescence, Camouflage Pattern, Color Changes

**2. Behavioral Mutations** (affect gameplay)

- Nocturnal/Diurnal (changes optimal posting times)
- Pack Hunter (bonus when population high)
- Territorial (bonus in home environment)
- Migratory (can survive multiple biomes)

**3. Sensory Mutations**

- Echolocation, Infrared Vision, Tremor Sense
- Pheromone Communication
- Magnetic Field Detection

**4. Special Abilities** (rare unlocks)

- Regeneration, Metamorphosis, Symbiosis
- Tool Use, Fire Creation, Language

**5. Evolutionary Dead Ends** (risky choices)

- Over-specialization: Great in one area, terrible elsewhere
- Requires specific resources that might disappear
- Example: "Crystal Wings" - Beautiful but fragile, only works in cave biome

---

### **Environmental Challenges**

**Climate Events:**

- Ice Age, Heat Wave, Drought, Flood
- Seasonal Changes (4 generation cycles)

**Ecological Events:**

- New Predator Appears (must adapt or lose population)
- Food Source Extinction
- New Species Competition
- Disease Outbreak

**Catastrophic Events:**

- Meteor Impact (rare, reshapes everything)
- Volcanic Eruption
- Mass Migration Event

**Each event shows:**

- Threat level (⚠️ Minor → ☠️ Extinction-level)
- Stat requirements to overcome
- Potential mutations that would help
- Community can see: "Our creature is 35% prepared for this challenge"

---

### **Visual Evolution System**

**Sprite Evolution:**

- Base creature starts simple
- Each mutation adds visual layer
- Community can see entire evolutionary history
- Time-lapse GIFs showing transformation

**Example Evolution Path:**

```
Gen 1:  ●●  (simple blob)

Gen 5:  ●● (added legs)
       /| |\

Gen 12: ●● (added wings, sharper eyes)
       /|\|\
        ^^

Gen 23: 👁️👁️ (added armor, color)
       [═╪═]
       /|\|\
```

**Evolutionary Tree:**

- Branching diagram showing all mutation paths
- "What if" scenarios: Show how different votes would have changed creature
- Extinct branches (failed adaptations)

---

### **Community Engagement Hooks**

**1. Controversy & Debate**

- Close votes create tension
- Comments section debates strategy
- "Min-maxers" vs "Fun mutations" factions

**2. Role-Playing**

- Players can form "Evolution Factions"
- "Aquatic Alliance" always votes for water traits
- "Sky Supremacists" want flying creature
- "Balanced Build" coalition

**3. Long-term Goals**

- "Can we create an apex predator?"
- "Can we achieve sentience?"
- "Can we colonize all biomes?"
- "Can we survive 100 generations?"

**4. Meta-Achievements**

- Community unlocks: "Survived impossible challenge"
- Creature gets named after community milestone
- Hall of Fame for key mutation proposers

---

### **Technical Implementation with Kiro**

**How Kiro Helps:**

1. **Specs for Complex Rules**

   - Mutation compatibility matrix
   - Stat calculation formulas
   - Challenge difficulty scaling

2. **Hooks for Automation**

   - Auto-generate sprite variations
   - Calculate optimal mutation suggestions
   - Generate challenge events based on current stats
   - Update evolutionary tree diagram
   - Create time-lapse animations

3. **Testing**

   - Simulate 100 generations to test balance
   - Edge case testing (all stats = 0, all = 100)
   - Voting manipulation prevention

4. **Documentation**
   - Auto-document mutation types
   - Generate player guide
   - Create API docs for future developers
