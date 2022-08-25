import ora from 'ora';

import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
 
const { BOT_TOKEN, REF } = process.env,
    __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);

/**
 * @typedef {object} ISendInfoInSendResult
 * @property {object} colorBet
 * @property {object} colorLast
 */

/**
 * 
 * @class
 * @classdesc
 * @author Elizandro Dantas
 * 
 * @see GitHub {@link https://github.com/elizandrodantas}
 */

export function Telegram(){
    /** @type {"pause" | "on"} */
    this.status = "pause";
    /** @type {Telegraf} */
    this.client = new Telegraf(BOT_TOKEN);

}

/**
 * ### função de inicialização da api telegram
 * 
 * @method start
 * @member Telegram
 * @instance
 * @returns {Promise<void>}
 * @api public
 */

Telegram.prototype.start = async function(){
    var startingOra = ora('iniciando bot').start();
    try{
        await this.client.launch();
        this.status = "on";
        
        startingOra.succeed("bot iniciado com sucesso");

        this.client.use(async (ctx, next) => {
            let { chat } = ctx, { id } = chat;
        });

        process.once("SIGINT", () => this.client.stop("SIGINT"));
        process.once("SIGTERM", () => this.client.stop("SIGTERM"));
    }catch(err){
        startingOra.fail("erro ao startar bot");
        throw new Error(`erro ao startar bot: [${err.message}]`);
    }
}

/**
 * ### função pai responsavel por envio de mensagens
 * 
 * ```javascript
 * Telegram.send('wello word', 'chatid')
 * // {status: "success", message: null }
 * ```
 * #### ou
 * 
 * ```javascript 
 * Telegram.send('wello word', ['chatid-1', 'chatid-2'])
 * // {status: "success", message: null }
 * ```
 * 
 * @method send
 * @memberof Telegram
 * @instance
 * @param {string} message 
 * @param {string | string[]} clientId 
 * @param {import('telegraf/typings/telegram-types').ExtraReplyMessage} options
 * @returns {Promise<{ status: "error" | "success", message?: string }>}
 * @api public 
 * 
 * @see Core Telegram {@link https://core.telegram.org/bots/api#sendmessage}
 */

Telegram.prototype.send = async function(message, clientId, options = { parse_mode: "HTML" }){
    if(this.status !== "on")
        return { status: "error", message: "bot ainda não foi startado!" }

    if(!message || !clientId)
        return { status: "error", message: "mensagem e id do chat são argumentos obrigatorios" }

    try{
        if(typeof clientId === "object" && Array.isArray(clientId)){
            for (let index = 0; index < clientId.length; index++) {
                await this.client.telegram.sendMessage(clientId[index], message, options);
            }
        }else if(typeof clientId === "string"){
            await this.client.telegram.sendMessage(clientId, message, options);
        }else{
            return { status: "error", message: "chat id deve ser uma string ou um array de string" }
        }
    }catch(err){
        return { status: "error", message: "erro ao enviar mensagem" }
    }

    return { status: "success", message: "mensagem enviada com sucesso" }
}

/**
 * ### função pai responsavel por envio de figura
 * 
 * ```javascript
 * await Telegram.sendSticker('sticker.jpg', 'chatid')
 * // {status: "success", message: "sticket enviado com sucesso" }
 * ```
 * 
 * #### ou
 * 
 * ```javascript
 * await Telegram.sendSticker('sticker.jpg', ['chatid-1', 'chatid-2'])
 * // {status: "success", message: "sticket enviado com sucesso" }
 * ```
 * 
 * @method sendSticker
 * @memberof Telegram
 * @instance
 * @param {string} filename 
 * @param {string | string[]} clientId 
 * @returns {Promise<{status: "error" | "success", message?: string}>}
 * @api public
 * 
 * @see Core Telegram {@link https://core.telegram.org/bots/api#sendsticker}
 */

Telegram.prototype.sendSticker = async function(filename, clientId){
    if(this.status !== "on")
        return { status: "error", message: "bot ainda não foi startado!" }

    if(!filename || !clientId)
        return { status: "error", message: "sticker e id do chat são argumentos obrigatorios" }

    let file = resolve(__dirname, '../', '../', 'sticker', filename)

    try{
        readFileSync(file);
    }catch(err){
        return { status: "error", message: "sticker não existe" }
    }

    try{
        if(typeof clientId === "object" && Array.isArray(clientId)){
            for (let index = 0; index < clientId.length; index++) {
                await this.client.telegram.sendSticker(clientId[index], { source: readFileSync(file) });
            }
        }else if(typeof clientId === "string"){
            await this.client.telegram.sendSticker(clientId, { source: readFileSync(file) });
        }else{
            return { status: "error", message: "chat id deve ser uma string ou um array de string" } 
        }
    }catch(err){
        return { status: "error", message: "erro ao enviar sticker" }
    }

    return { status: "success", message: "sticket enviado com sucesso" }
}

/**
 * ### envia mensagem para entrada
 * 
 * @method sendIn
 * @memberof Telegram
 * @instance
 * @param {number} color
 * @param {string | string[]} client
 * @param {number?} protection - entrar na proteção (branco)
 * @param {string?} gale - informativo para entrada no gale
 * @returns {Promise<{ status: "error" | "success", message?: string }>}
 * @api public
 */

Telegram.prototype.sendIn = async function(color, clientId, protection = false, gale = false){
    if(!color || !clientId)
        return { status: "error", message: "cor e id do chat são argumentos obrigatorios" }

    let message = [];

    if(gale)
        message.push(`⚠️ <b>ENTROU PRA ${gale}:</b>\n`);
    else
        message.push(`🔎 <b>SINAL ENCONTRADO:</b>\n`);

    message.push(`ENTRE NO ${this._getColorNameOrEmoticon(color, true)} ${this._getColorNameOrEmoticon(color, false, true)}`);
    if(typeof protection === "number")
        message.push(`PROTEJA NO ${this._getColorNameOrEmoticon(protection, true)} ${this._getColorNameOrEmoticon(protection, false, true)}`);
    message.push(`\n<pre>https://blaze.com/${REF ? "r/" + REF : ""}</pre>`);

    return await this.send(message.join('\n'), clientId, { parse_mode: "HTML" } );
}

/**
 * ### envia resultado da jogada para chat
 * 
 * @method sendResult
 * @memberof Telegram
 * @instance
 * @param {"green" | "gale" | "white" | "loss"} result 
 * @param {string | string[]} clientId 
 * @param {ISendInfoInSendResult?} infoBet 
 * @param {boolean} sendInfo - envia informações de jogada e resultado da jogada 
 * @returns {Promise<{status: "error" | "success", message: string }>}
 * @api public
 */

Telegram.prototype.sendResult = async function(result, clientId, infoBet, sendInfo = true){
    if(!["green", "white", "gale", "loss"].includes(result))
        return { status: "error", message: "tipo do resultado invalido" }
    
    if(typeof infoBet === "object" &&
        ("colorBet" in infoBet && "colorLast" in infoBet) && sendInfo){

        let message = [];

        message.push('🔸 ENTRAMOS NO ' + this._getColorNameOrEmoticon(infoBet.colorBet, true));
        message.push('🔹 RESULTADO FOI ' + this._getColorNameOrEmoticon(infoBet.colorLast, true));

        await this.send(message.join('\n'), clientId, { parse_mode: "HTML" });
    }

    let stickerName = result === "green" ?
        "win" :
        result === "gale" ? 
        "win-in-gale" :
        result === "white" ?
        "win-white" :
        "loss";

    if(stickerName)
        await this.sendSticker(stickerName + '.jpg', clientId);

    return { status: "success", message: "resultado enviado com sucesso" }
}

/**
 * ### fechar api telegram
 * 
 * @method close
 * @memberof Telegram
 * @instance
 * @returns {void}
 * @api public
 */

Telegram.prototype.close = function(){
    this.client.stop();

    console.log("telegram closed successful");
}

/**
 * retorna emoticon ou nome da cor de acordo com numero passado
 * 
 * @method _getColorNameOrEmoticon
 * @memberof Telegram
 * @interface
 * @param {0 | 1 | 2} color 
 * @param {boolean} emoticon 
 * @param {boolean} pt 
 * @returns {string}
 * @api private
 */

Telegram.prototype._getColorNameOrEmoticon = function(color, emoticon = false, pt = false){
    if(color === 0) return emoticon ? "⚪️" : pt ? "branco" : "white";
    if(color === 1) return emoticon ? "🔴" : pt ? "vermelho" : "red";
    if(color === 2) return emoticon ? "⚫" : pt ? "preto" : "black";

    return "";
}