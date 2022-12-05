import { isArray, isBoolean, isNumber, isObject, isString, isUndefined } from "../util/validations.mjs";
import { BlazeCore } from '../core/blaze.mjs';
import { getColorWithRoll, getRollRandomWithColor, transformStringToNumberColor } from "../util/blaze.mjs";

/**
 * @typedef {object} IColorOrRoll
 * @property {string | number} color - cor (string/number)
 * @property {number} roll - numero da rodada
 */

/**
 * @typedef {object} IAnalysisKitten
 * @property {IColorOrRoll[]} search - array/numero rodada/cor que o gatilho ira identificar entrada
 * @property {number} startSearchOf - quantas rodadas ira pular para procurar gatilho (padrão: 0 - ultima rodada)
 * @property {number | string} entryColor - cor de entrada
 * @property {number} entryRoll - numero da rodada de entrada
 */

/**
* 
* @typedef {object} IResponseLastAnalise
* @property { "error" | "success" } status
* @property { import("./blaze.mjs").IDataBlazeResponse } last
* @property { boolean } verify
* @property {{ color: number, roll: number }} entry
* @property { import("./blaze.mjs").IDataBlazeResponse } recents
*/

/**
 * 
 * @class
 * @classdesc
 * @author Elizandro Dantas
 * 
 * @see GitHub {@link https://github.com/elizandrodantas}
 */

export class Analise {

    /**
     * 
     * @param {import("./blaze.mjs").IDataBlazeResponse[]} recents 
     */    
    constructor(recents){
        this.recents = recents;
    }


    /**
     * 
     * @param {import("./blaze.mjs").IDataBlazeResponse[]} recents 
     * @returns {IResponseLastAnalise}
     */

    static withLast(recents){
        const lastNeed = recents.slice(0, 16), lastAccept = lastNeed[lastNeed.length - 1],
            rule = [ 1,2,3,4,5,6,7,8,9,10,11,12,13,14 ];

        return {
            status: 'success',
            last: lastAccept,
            recents: recents,
            entry: rule.includes(lastAccept.roll)
        }
    }

    /**
     * 
     * @param {IAnalysisKitten[] | IAnalysisKitten} analysis
     * @return {{ status: 'fail' | 'success', message: string, entry: boolean }}
     */

    process(analysis){
        let output;

        if(isArray(analysis)){
            for(let i of analysis){
                let data = this.proccessOfAnalysis(i);

                if(data.status === "success" && isBoolean(data.entry)){
                    output = data;
                    break;
                }
            }
        }

        if(isObject(analysis)){
            let data = this.proccessOfAnalysis(analysis);

            if(data.status === "success" && isBoolean(data.entry))
                output = data;
        }

        if(!output)
            return {
                status: 'fail',
                message: 'nenhum gatilho encontrado'
            }
        
        return output
    }
    

    /**
     * 
     * @param {IAnalysisKitten} analysis
     * @return {{ status: string, message: string, last: IColorOrRoll, recents: import("./blaze.mjs").IDataBlazeResponse[], entry: boolean }}
     */

    proccessOfAnalysis(analysis){
        let { entryColor, entryRoll, search, startSearchOf } = analysis,
            blazeClient = new BlazeCore();

        if(!search || !this.recents)
            return {
                status: 'fail',
                message: 'parametros para analise incorretos'
            }        
            
        let recents = this.recents;
        
        if(!startSearchOf || (startSearchOf && !isNumber(startSearchOf)))
            startSearchOf = 0;

        if(startSearchOf && startSearchOf > 0){
            if((startSearchOf + search.length) > recents.length){
                recents = blazeClient.generateRecents(this.recents[0].server_seed, Math.floor((startSearchOf + search.length) * 1.1));
            }
        }

        if(!isArray(search))
            return {
                status: 'fail',
                message: 'search deve ser um array'
            }

        let entry = false;

        if(isArray(search))
            entry = this.#searchArrayAnalysis(search, recents.slice(startSearchOf, recents.length));
    
        if(!entry)
            return {
                status: 'success',
                entry: false
            }

        const outputLast = this.#treatEntry(entryColor, entryRoll, recents.slice(startSearchOf, recents.length));

        if(isUndefined(outputLast.color) || isUndefined(outputLast.roll))
            return {
                status: 'fail',
                message: 'erro ao tratar cor de entrada'
            }

        return {
            status: 'success',
            last: outputLast,
            recents,
            entry
        }
    }

    /**
     * 
     * @param {IColorOrRoll[]} array 
     * @param {import("./blaze.mjs").IDataBlazeResponse[]} recents 
     * @return {boolean}
     */

    #searchArrayAnalysis(array, recents){
        let output = false,
            k = 0;

        for(let i = 0; i < array.length; i++){
            let { color, roll } = array[i];

            if(color && isString(color))
                color = transformStringToNumberColor(color);

            if(color && !isNumber(color))
                color = 3
            if(roll && !isNumber(roll))
                roll = 17;

            if(color && (recents[i]?.color === color)){
                if(!roll)
                    k++
            }

            if(roll && (recents[i]?.roll === roll))
                if(color){
                    if(color && (recents[i]?.color === color)){
                        k++
                    }
                }else{
                    k++
                }
                
        }

        if(k === array.length)
            output = true;

        return output;
    }

    /**
     * 
     * @param {IColorOrRoll} obj 
     * @param {import("./blaze.mjs").IDataBlazeResponse} recents 
     * @return {boolean}
     * @deprecated
     */

    #searchObjAnalysis(obj, recents){
        let { color, roll } = obj,
            { color: rColor, roll: rRoll } = recents;

        if(color && isString(color))
            color = transformStringToNumberColor(color);

        if(color && !isNumber(color))
            color = 3
        if(roll && !isNumber(roll))
            roll = 17;

        if(color && (rColor === color)){
            if(!roll)
                return true
        }

        if(roll && (rRoll === roll))
            if(color){
                if(color && (rColor === color)){
                    return true
                }
            }else{
                return true
            }

        return false;
    }

    /**
     * 
     * @param {number} entryColor 
     * @param {number} entryRoll 
     * @param {import("./blaze.mjs").IDataBlazeResponse[]} recents 
     * @return {IColorOrRoll}
     */

    #treatEntry(entryColor, entryRoll, recents){
        

        if(entryColor){
            if(isString(entryColor))
                entryColor = transformStringToNumberColor(entryColor);

            if(!isNumber(entryColor))
                entryColor = undefined;
        }

        if(entryRoll && !isNumber(entryRoll))
            entryRoll = undefined;

        if(isUndefined(entryColor) && isUndefined(entryRoll)){
            const { color, roll } = recents[0];
        
            return {
                color,
                roll
            }
        }

        let output = {
            color: isUndefined(entryColor) ? getColorWithRoll(entryRoll) : entryColor,
            roll: entryRoll || getRollRandomWithColor(entryColor)
        }


        if(output.color === 1 && (output.roll > 7 || output.roll < 1))
            return {
                color: undefined,
                roll: undefined
            }

        if(output.color === 2 && (output.roll < 7 || output.roll > 14))
            return {
                color: undefined,
                roll: undefined
            }

        if(output.color === 0 && output.roll !== 0)
            return {
                color: undefined,
                roll: undefined
            }

        return output;
    }
}