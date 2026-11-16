const { Telegraf, Markup } = require('telegraf');

// Вставте свій токен від @BotFather всередині лапок нижче
const TOKEN = 'ВАШ_ТОКЕН_ТУТ';
const bot = new Telegraf(TOKEN);

const userState = {};

bot.start((ctx) => {
    userState[ctx.from.id] = { step: 'choose_type' };
    ctx.reply(
        "Welcome! Let's create a new sticker pack or custom emoji pack.\n\nPlease choose the pack type:",
        Markup.inlineKeyboard([
            [Markup.button.callback('📦 Sticker Pack', 'type_sticker')],
            [Markup.button.callback('⭐ Custom Premium Emoji', 'type_emoji')]
        ])
    );
});

bot.action(/type_(.+)/, async (ctx) => {
    const type = ctx.match[1] === 'sticker' ? 'Sticker Pack' : 'Custom Emoji Pack';
    userState[ctx.from.id] = { type, step: 'get_title' };
    await ctx.editMessageText(`Selected: <b>${type}</b>\n\nNow, please send the <b>Sticker Pack Title</b>:`, { parse_mode: 'HTML' });
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const state = userState[userId];
    if (!state) return;

    if (state.step === 'get_title') {
        state.title = ctx.message.text;
        state.step = 'get_link';
        await ctx.reply("Great! Now send the <b>Pack Link/URL</b> (shortname, e.g., <code>my_cool_pack</code>):", { parse_mode: 'HTML' });
    } else if (state.step === 'get_link') {
        state.link = ctx.message.text;
        state.step = 'get_media';
        await ctx.reply("Now, send your media (<b>Photo, Video, GIF, or File</b>) without compression loss:", { parse_mode: 'HTML' });
    } else if (state.step === 'get_emoji') {
        state.emoji = ctx.message.text;
        state.step = 'batch_menu';
        await ctx.reply(
            `Sticker processed successfully with emoji ${state.emoji}!\nPack Title: ${state.title}\n\nWhat's next?`,
            Markup.inlineKeyboard([
                [Markup.button.callback('➕ Add another sticker', 'add_more')],
                [Markup.button.callback('🗑 Delete last sticker', 'delete_last')],
                [Markup.button.callback('✅ Publish pack', 'publish')]
            ])
        );
    }
});

bot.on(['photo', 'video', 'document', 'animation'], async (ctx) => {
    const userId = ctx.from.id;
    const state = userState[userId];
    if (state && state.step === 'get_media') {
        state.step = 'get_emoji';
        await ctx.reply("Media received! Now, send a matching <b>emoji</b> for this sticker:", { parse_mode: 'HTML' });
    }
});

bot.action('add_more', async (ctx) => {
    const state = userState[ctx.from.id];
    if (state) {
        state.step = 'get_media';
        await ctx.editMessageText("Send your next media (<b>Photo, Video, GIF, or File</b>):", { parse_mode: 'HTML' });
    }
});

bot.action('publish', async (ctx) => {
    const state = userState[ctx.from.id];
    if (state) {
        await ctx.editMessageText(`🎉 Your pack <b>${state.title}</b> has been successfully published!\n\n🔗 Link: t.me/addstickers/${state.link}`, { parse_mode: 'HTML' });
        delete userState[ctx.from.id];
    }
});

bot.launch();
console.log('[bot] started successfully');
