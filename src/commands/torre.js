const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const BattleEngine = require("../services/BattleEngine");
const EmbedManager = require("../services/EmbedManager");
const towerConfig = require("../config/towerConfig");

module.exports = {
  name: "torre",
  description: "Desafie a Torre Infinita!",
  async execute(message, args) {
    const playerId = message.author.id;
    const now = Date.now();

    // 1. Verificar se o jogador tem personagem equipado
    const player = playerRepository.getPlayer(playerId);
    if (!player.equipped_instance_id) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você precisa equipar um personagem antes de entrar na torre! Use `!equip`.", false)] });
    }

    // 2. Verificar se está em party
    const party = global.parties ? Array.from(global.parties.values()).find(p => p.members.includes(playerId)) : null;
    const isLeader = party ? party.leaderId === playerId : true;
    const members = party ? party.members : [playerId];

    if (party && !isLeader) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Apenas o líder da party pode iniciar a Torre Infinita.", false)] });
    }

    // 3. Verificar cooldown e combate de todos os membros
    for (const memberId of members) {
      const cooldown = playerRepository.getTowerCooldown(memberId);
      if (cooldown.available_at > now) {
        const remainingMin = Math.ceil((cooldown.available_at - now) / (1000 * 60));
        const user = await message.client.users.fetch(memberId);
        return message.reply({ 
          embeds: [EmbedManager.createStatusEmbed(`**${user.username}** ainda está em cooldown da torre! Restam **${remainingMin} minutos**.`, false)] 
        });
      }
      
      const mPlayer = playerRepository.getPlayer(memberId);
      if (!mPlayer.equipped_instance_id) {
        const user = await message.client.users.fetch(memberId);
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`O membro **${user.username}** não tem um personagem equipado!`, false)] });
      }

      // Verificar se algum membro já está em batalha
      const status = BattleEngine.canStartBattle(memberId);
      if (!status.can) {
        const user = await message.client.users.fetch(memberId);
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`**${user.username}** já está em um combate ativo ou na fila ranqueada!`, false)] });
      }
    }

    // 4. Criar Embed de Introdução
    const embed = new EmbedBuilder()
      .setTitle("🗼 Torre Infinita")
      .setDescription(`Bem-vindos à **Torre Infinita**! Preparem-se para enfrentar desafios crescentes.\n\n**Regras:**\n- A vida não recupera entre os andares.\n- Derrota aplica cooldown de 30 minutos para todos.\n- Ganhe Pedras da Alma e Fragmentos Zenith a cada andar.\n\n**Membros:** ${members.map(id => `<@${id}>`).join(", ")}`)
      .setColor("#FFD700")
      .setThumbnail("https://i.ibb.co/v6YmR0K/tower.png")
      .setFooter({ text: "Clique no botão abaixo para começar do 1º Andar!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tower_start_1_${playerId}`)
        .setLabel("Começar Desafio")
        .setStyle(ButtonStyle.Success)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }
};
