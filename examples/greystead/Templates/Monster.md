<!--
  Bestiary template. Right-click Bestiary/ → New monster… (or copy into Bestiary/ and rename).
  Art: Bestiary/Art/Monster Name.png, or Load art on the sheet. Prefer Add to Bestiary from Lookup for SRD creatures.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# Monster Name

[!monster]
![[Monster Name.png]]

| | |
|---|---|
| **CR** | 1 |
| **Role** | Pressure / boss / minion |
| **Source** | MM / custom |
[!/monster]

```statblock
layout: Basic 5e Layout
name: Monster Name
size: Medium
type: undead
alignment: chaotic evil
ac: 12
hp: 22
hit_dice: 5d8
speed: 30 ft.
stats: [13, 15, 10, 7, 10, 6]
damage_immunities: "Poison"
senses: "Darkvision 60 ft., passive Perception 10"
languages: "Common"
cr: 1
traits:
  - name: Pack Tactics
    desc: "Advantage on attack rolls if an ally is within 5 ft. of the target and not Incapacitated."
actions:
  - name: Claw
    desc: "+4 to hit, reach 5 ft. Hit: 4 (1d4+2) slashing."
```

*One line: what it does at the table.*

## Notes

Where it appears. What to telegraph. When to cut it if the fight runs long.

[!gmonly]
Tuning: add or drop HP, skip a recharge, or have it flee.
[!/gmonly]
