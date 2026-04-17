"use strict";
const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionFlagsBits,
} = require("discord.js");

const TICKETS_CHANNEL_ID = "1494760685945749675";
const SUPPORT_ROLE_ID    = "1494760908243603720";
const TICKET_COLOR       = "#1a1a2e";
const TICKET_THUMB       = "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/2753.png";
const TICKET_TIMEOUT_MS  = 30 * 60 * 1000;

const CATEGORIES = {
  denuncia:   { label: "Denúncias",   emoji: "🚨", desc: "Denunciar algum caso" },
  duvida:     { label: "Dúvidas",     emoji: "❓", desc: "Tirar dúvida com o suporte" },
  financeiro: { label: "Financeiro",  emoji: "💳", desc: "Problemas com compras" },
  bug:        { label: "Bug no Bot",  emoji: "🐛", desc: "Algo no bot que bugou" },
};

// Map<ticketId, { userId, username, category, guildId, channelId, timeoutId }>
const activeTickets = new Map();

// ─── EMBEDS / COMPONENTS ────────────────────────────────────────────────────

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setColor(TICKET_COLOR)
    .setAuthor({ name: "Central de Suporte" })
    .setThumbnail(TICKET_THUMB)
    .setDescription(
      "Abra um ticket e nossa equipe entrará em contato com você o mais breve possível.\n" +
      "Selecione abaixo a categoria que melhor descreve o seu problema."
    )
    .addFields(
      { name: "🚨  Denúncias", value: "Relate comportamentos inadequados ou infrações às regras.", inline: false },
      { name: "❓  Dúvidas", value: "Dúvidas sobre o servidor, sistemas ou comandos do bot.", inline: false },
      { name: "💳  Financeiro", value: "Problemas com compras, doações ou benefícios pagos.", inline: false },
      { name: "🐛  Bug no Bot", value: "Relate erros ou comportamentos inesperados do bot.", inline: false },
    )
    .setFooter({ text: "Use o menu abaixo para abrir seu ticket" });
}

function buildPanelMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("Como podemos te ajudar?")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel("Denúncias").setValue("denuncia").setEmoji("🚨").setDescription("Relatar um comportamento inadequado"),
        new StringSelectMenuOptionBuilder().setLabel("Dúvidas").setValue("duvida").setEmoji("❓").setDescription("Falar com o suporte sobre algo"),
        new StringSelectMenuOptionBuilder().setLabel("Financeiro").setValue("financeiro").setEmoji("💳").setDescription("Problemas com compras ou benefícios"),
        new StringSelectMenuOptionBuilder().setLabel("Bug no Bot").setValue("bug").setEmoji("🐛").setDescription("Reportar um erro ou falha no bot"),
      )
  );
}

function buildTicketNotifEmbed(ticket) {
  const cat = CATEGORIES[ticket.category];
  return new EmbedBuilder()
    .setColor("#FF9900")
    .setTitle(`${cat.emoji} Novo Ticket — ${cat.label}`)
    .setDescription(
      `**Usuário:** <@${ticket.userId}> (\`${ticket.username}\`)\n` +
      `**Categoria:** ${cat.emoji} ${cat.label}\n` +
      `**ID:** \`${ticket.ticketId}\`\n\n` +
      `**Problema relatado:**\n> ${ticket.description}`
    )
    .setTimestamp()
    .setFooter({ text: "Ticket aberto • Responder ou ignorar" });
}

function buildTicketNotifRow(ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_approve_${ticketId}`)
      .setLabel("✅ Responder Ticket")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ticket_reject_${ticketId}`)
      .setLabel("❌ Ignorar Ticket")
      .setStyle(ButtonStyle.Danger),
  );
}

function buildSupportChannelEmbed(ticket) {
  const cat = CATEGORIES[ticket.category];
  return new EmbedBuilder()
    .setColor(TICKET_COLOR)
    .setTitle(`${cat.emoji} Ticket — ${cat.label}`)
    .setDescription(
      `**Aberto por:** <@${ticket.userId}>\n` +
      `**Categoria:** ${cat.emoji} ${cat.label}\n\n` +
      `**Problema relatado:**\n> ${ticket.description}\n\n` +
      `> ⏰ Este canal será encerrado automaticamente em **30 minutos**.`
    )
    .setTimestamp()
    .setFooter({ text: `Ticket #${ticket.ticketId}` });
}

function buildCloseRow(ticketId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close_${ticketId}`)
      .setLabel("🔒 Encerrar Suporte")
      .setStyle(ButtonStyle.Danger),
  );
}

// ─── HANDLERS ───────────────────────────────────────────────────────────────

async function handleSelect(interaction) {
  const category = interaction.values[0];
  const cat = CATEGORIES[category];

  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${category}`)
    .setTitle(`${cat.emoji} ${cat.label}`);

  const input = new TextInputBuilder()
    .setCustomId("ticket_description")
    .setLabel("Descreva seu problema")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Explique detalhadamente o que aconteceu...")
    .setMinLength(10)
    .setMaxLength(1000)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction, category) {
  const description = interaction.fields.getTextInputValue("ticket_description");
  const ticketId = Date.now().toString(36);

  const ticket = {
    ticketId,
    userId:      interaction.user.id,
    username:    interaction.user.username,
    category,
    description,
    guildId:     interaction.guildId,
    channelId:   null,
    timeoutId:   null,
  };
  activeTickets.set(ticketId, ticket);

  try {
    const ticketsChannel = await interaction.client.channels.fetch(TICKETS_CHANNEL_ID).catch(() => null);
    if (!ticketsChannel) {
      return interaction.reply({ content: "❌ Canal de tickets não encontrado. Contate um administrador.", ephemeral: true });
    }

    await ticketsChannel.send({
      content: `<@&${SUPPORT_ROLE_ID}>`,
      embeds: [buildTicketNotifEmbed(ticket)],
      components: [buildTicketNotifRow(ticketId)],
    });
  } catch (e) {
    console.error("[TICKET] handleModalSubmit send error:", e);
  }

  const cat = CATEGORIES[category];
  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setColor("#00AA00")
      .setDescription(`✅ **Ticket enviado!**\nCategoria: ${cat.emoji} **${cat.label}**\n\nAguarde — o suporte irá responder em breve.`)],
    ephemeral: true,
  });
}

async function handleApprove(interaction, ticketId) {
  const ticket = activeTickets.get(ticketId);
  if (!ticket) {
    return interaction.reply({ content: "❌ Ticket não encontrado ou já processado.", ephemeral: true });
  }

  try {
    const guild = interaction.guild;

    const channel = await guild.channels.create({
      name: `ticket-${ticket.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "usuario"}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: ticket.userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      ],
    });

    ticket.channelId = channel.id;

    await channel.send({
      content: `<@${ticket.userId}> <@${interaction.user.id}>`,
      embeds: [buildSupportChannelEmbed(ticket)],
      components: [buildCloseRow(ticketId)],
    });

    // Auto-delete após 30 minutos
    ticket.timeoutId = setTimeout(() => closeTicketChannel(interaction.client, ticketId, true), TICKET_TIMEOUT_MS);

    // Atualiza a mensagem no canal de tickets (remove botões)
    const cat = CATEGORIES[ticket.category];
    await interaction.update({
      embeds: [buildTicketNotifEmbed(ticket).setColor("#00AA00").setFooter({ text: `✅ Atendido por ${interaction.user.username}` })],
      components: [],
    });
  } catch (e) {
    console.error("[TICKET] handleApprove error:", e);
    await interaction.reply({ content: "❌ Erro ao criar o canal de ticket.", ephemeral: true });
  }
}

async function handleReject(interaction, ticketId) {
  const ticket = activeTickets.get(ticketId);
  if (!ticket) {
    return interaction.reply({ content: "❌ Ticket não encontrado ou já processado.", ephemeral: true });
  }

  // DM o usuário
  try {
    const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
    if (user) {
      const cat = CATEGORIES[ticket.category];
      const dmEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Ticket Recusado")
        .setDescription(
          `Seu ticket da categoria **${cat.emoji} ${cat.label}** foi recusado pelo suporte.\n\n` +
          `Se o problema persistir, tente abrir um novo ticket.`
        )
        .setTimestamp();
      await user.send({ embeds: [dmEmbed] }).catch(() => {});
    }
  } catch (e) {
    console.error("[TICKET] handleReject DM error:", e);
  }

  activeTickets.delete(ticketId);

  await interaction.update({
    embeds: [buildTicketNotifEmbed(ticket).setColor("#FF0000").setFooter({ text: `❌ Ignorado por ${interaction.user.username}` })],
    components: [],
  });
}

async function handleClose(interaction, ticketId) {
  await interaction.deferReply({ ephemeral: true }).catch(() => {});
  await closeTicketChannel(interaction.client, ticketId, false);
  await interaction.editReply({ content: "✅ Canal encerrado." }).catch(() => {});
}

async function closeTicketChannel(client, ticketId, isTimeout) {
  const ticket = activeTickets.get(ticketId);
  if (!ticket || !ticket.channelId) return;

  if (ticket.timeoutId) clearTimeout(ticket.timeoutId);
  activeTickets.delete(ticketId);

  try {
    const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
    if (!channel) return;

    if (isTimeout) {
      const timeoutEmbed = new EmbedBuilder()
        .setColor("#FF6600")
        .setDescription("⏰ **Tempo esgotado.** Este canal será deletado em instantes.");
      await channel.send({ embeds: [timeoutEmbed] }).catch(() => {});
      await new Promise(r => setTimeout(r, 5000));
    }

    await channel.delete("Ticket encerrado").catch(() => {});
  } catch (e) {
    console.error("[TICKET] closeTicketChannel error:", e);
  }
}

// ─── INTERACTION ROUTER ─────────────────────────────────────────────────────

async function handleInteraction(interaction) {
  try {
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {
      return await handleSelect(interaction);
    }
    if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
      const category = interaction.customId.slice("ticket_modal_".length);
      return await handleModalSubmit(interaction, category);
    }
    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id.startsWith("ticket_approve_")) return await handleApprove(interaction, id.slice("ticket_approve_".length));
      if (id.startsWith("ticket_reject_"))  return await handleReject(interaction, id.slice("ticket_reject_".length));
      if (id.startsWith("ticket_close_"))   return await handleClose(interaction, id.slice("ticket_close_".length));
    }
  } catch (e) {
    console.error("[TICKET] handleInteraction error:", e);
    try { await interaction.reply({ content: "❌ Erro interno no sistema de tickets.", ephemeral: true }); } catch (_) {}
  }
}

// ─── ADMIN COMMAND ──────────────────────────────────────────────────────────

async function postTicketEmbed(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply("❌ Apenas administradores podem usar este comando.");
  }
  try {
    await message.channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelMenu()] });
    await message.delete().catch(() => {});
  } catch (e) {
    console.error("[TICKET] postTicketEmbed error:", e);
    await message.reply("❌ Erro ao postar o painel de tickets.");
  }
}

module.exports = { handleInteraction, postTicketEmbed };
