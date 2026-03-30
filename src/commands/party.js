const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const EmbedManager = require("../services/EmbedManager");

// Gerenciamento simples de parties em memória
global.parties = global.parties || new Map();

module.exports = {
  name: "party",
  description: "Cria ou convida jogadores para uma party",
  async execute(message, args) {
    const leaderId = message.author.id;
    const mentionedUser = message.mentions.users.first();

    // Se não houver menção, mostra o status da party atual
    if (!mentionedUser) {
      const party = Array.from(global.parties.values()).find(p => p.members.includes(leaderId));
      if (!party) {
        return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não está em nenhuma party. Use `!party @jogador` para convidar alguém.", false)] });
      }

      const leader = await message.client.users.fetch(party.leaderId);
      const members = await Promise.all(party.members.map(id => message.client.users.fetch(id)));
      
      const embed = new EmbedBuilder()
        .setTitle("🛡️ Sua Party")
        .setDescription(`**Líder:** ${leader.username}\n**Membros:** ${members.map(m => m.username).join(", ")}`)
        .setColor("#5865F2")
        .setFooter({ text: "Use !party-sair para sair ou !party-desfazer se for o líder." });

      return message.reply({ embeds: [embed] });
    }

    if (mentionedUser.id === leaderId) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não pode convidar a si mesmo.", false)] });
    }

    if (mentionedUser.bot) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não pode convidar bots.", false)] });
    }

    // Verificar se o líder já tem uma party
    let party = global.parties.get(leaderId);
    
    // Se o usuário não é líder, mas está em uma party, ele não pode convidar
    if (!party) {
      const existingParty = Array.from(global.parties.values()).find(p => p.members.includes(leaderId));
      if (existingParty) {
        return message.reply({ embeds: [EmbedManager.createStatusEmbed("Apenas o líder da party pode convidar novos membros.", false)] });
      }
    }

    if (party && party.members.length >= 3) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("A party já está cheia (máximo 3 jogadores).", false)] });
    }

    if (party && party.members.includes(mentionedUser.id)) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`**${mentionedUser.username}** já está na sua party.`, false)] });
    }

    // Verificar se o convidado já está em outra party
    const targetInParty = Array.from(global.parties.values()).find(p => p.members.includes(mentionedUser.id));
    if (targetInParty) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`**${mentionedUser.username}** já está em outra party.`, false)] });
    }

    // Criar o convite com botões
    const inviteEmbed = new EmbedBuilder()
      .setTitle("🛡️ Convite de Party")
      .setDescription(`**${message.author.username}** convidou você para entrar na party dele!`)
      .setColor("#5865F2")
      .setFooter({ text: "Você tem 60 segundos para aceitar." });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`party_accept_${leaderId}_${mentionedUser.id}`)
        .setLabel("Aceitar")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`party_decline_${leaderId}_${mentionedUser.id}`)
        .setLabel("Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    await message.reply({ content: `<@${mentionedUser.id}>`, embeds: [inviteEmbed], components: [row] });
  }
};
