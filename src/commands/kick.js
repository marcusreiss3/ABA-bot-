const { EmbedBuilder } = require("discord.js");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  name: "kick",
  description: "Expulsa um jogador da sua party",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [EmbedManager.createStatusEmbed(msg, false)] });
    const leaderId = message.author.id;
    const mentionedUser = message.mentions.users.first();

    if (!mentionedUser) {
      return err("Você precisa mencionar o jogador que deseja expulsar. Exemplo: `!kick @jogador`.");
    }

    const party = global.parties.get(leaderId);
    if (!party) {
      return err("Você não é o líder de nenhuma party.");
    }

    if (mentionedUser.id === leaderId) {
      return err("Você não pode se expulsar da sua própria party. Use `!party-desfazer` para encerrá-la.");
    }

    const memberIndex = party.members.indexOf(mentionedUser.id);
    if (memberIndex === -1) {
      return err(`**${mentionedUser.username}** não está na sua party.`);
    }

    // Remover o membro
    party.members.splice(memberIndex, 1);
    
    const embed = new EmbedBuilder()
      .setTitle("👢 Jogador Expulso")
      .setDescription(`**${mentionedUser.username}** foi removido da party por **${message.author.username}**.`)
      .setColor("#FF0000");

    return message.reply({ embeds: [embed] });
  }
};
