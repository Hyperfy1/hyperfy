/* global app, world, Vector3 */

// Non-graphic melee sparring arena. Attach this script to an app in a world.

const ARENA_SIZE = 24
const WALL_HEIGHT = 4
const MAX_HEALTH = 100
const ATTACK_DAMAGE = 25
const ATTACK_RANGE = 2
const ATTACK_COOLDOWN = 0.7
const RESPAWN_DELAY = 3
const HIT_ARC_DOT = 0.35

const lastAttacks = new Map()
const respawns = new Map()

const floor = app.create('prim', {
  type: 'box',
  scale: [ARENA_SIZE, 0.2, ARENA_SIZE],
  position: [0, -0.1, 0],
  color: '#292d38',
  roughness: 0.8,
  physics: 'static',
})
app.add(floor)

for (const [x, z, width, depth] of [
  [0, -ARENA_SIZE / 2, ARENA_SIZE, 0.5],
  [0, ARENA_SIZE / 2, ARENA_SIZE, 0.5],
  [-ARENA_SIZE / 2, 0, 0.5, ARENA_SIZE],
  [ARENA_SIZE / 2, 0, 0.5, ARENA_SIZE],
]) {
  const wall = app.create('prim', {
    type: 'box',
    scale: [width, WALL_HEIGHT, depth],
    position: [x, WALL_HEIGHT / 2, z],
    color: '#414958',
    physics: 'static',
  })
  app.add(wall)
}

const control = world.isClient ? app.control() : null
if (control) {
  control.keyF.onPress = () => app.send('attack', {})
}

if (world.isServer) {
  app.on('attack', (data, attackerNetworkId) => {
    const now = world.getTime()
    const players = world.getPlayers()
    const attacker = players.find(player => player.networkId === attackerNetworkId)
    if (!attacker || attacker.health <= 0 || respawns.has(attacker.id)) return
    const lastAttack = lastAttacks.get(attacker.id)
    if (lastAttack !== undefined && now - lastAttack < ATTACK_COOLDOWN) return
    lastAttacks.set(attacker.id, now)

    const origin = attacker.position.clone()
    const forward = new Vector3(0, 0, -1).applyQuaternion(attacker.quaternion)
    forward.y = 0
    forward.normalize()

    let target = null
    let targetDirection = null
    let nearestDistance = ATTACK_RANGE
    for (const player of players) {
      if (player.id === attacker.id || player.health <= 0 || respawns.has(player.id)) continue
      const direction = player.position.clone().sub(origin)
      direction.y = 0
      const distance = direction.length()
      if (distance === 0 || distance > nearestDistance) continue
      direction.normalize()
      if (forward.dot(direction) < HIT_ARC_DOT) continue
      target = player
      targetDirection = direction
      nearestDistance = distance
    }

    if (!target) return
    target.damage(ATTACK_DAMAGE)
    target.push(new Vector3(targetDirection.x * 8, 2.5, targetDirection.z * 8))

    const knockedOut = target.health <= 0
    if (knockedOut) respawns.set(target.id, now + RESPAWN_DELAY)
  })

  app.on('fixedUpdate', () => {
    const now = world.getTime()
    const players = world.getPlayers()
    for (const [playerId, respawnAt] of respawns) {
      const player = players.find(candidate => candidate.id === playerId)
      if (!player) {
        respawns.delete(playerId)
        lastAttacks.delete(playerId)
      } else if (now >= respawnAt) {
        player.teleport(new Vector3(0, 0, 0), 0)
        player.heal(MAX_HEALTH)
        respawns.delete(playerId)
        lastAttacks.delete(playerId)
      }
    }
  })
}
