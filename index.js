const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);


bot.start((ctx) => {
    ctx.reply("✅ ربات روشنه");
});


// تست دریافت همه پیام‌ها
bot.on("message", async (ctx) => {

    console.log("MESSAGE RECEIVED:");

    console.log({
        chat: ctx.chat.id,
        type: ctx.chat.type,
        user: ctx.from?.username,
        text: ctx.message.text
    });


    // فقط برای تست:
    if (ctx.message.text) {

        await ctx.reply(
            "پیامت رو دیدم ✅"
        );

    }

});



bot.launch()
.then(() => {
    console.log("Bot Started");
})
.catch((err) => {
    console.log("ERROR:", err);
});



process.once(
    "SIGINT",
    () => bot.stop("SIGINT")
);

process.once(
    "SIGTERM",
    () => bot.stop("SIGTERM")
);
