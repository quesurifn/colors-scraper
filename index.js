const cheerio = require('cheerio');
const rp = require('request-promise');
const fs = require('fs');

const json = fs.readFileSync('./colors.json', {encoding: 'utf8'});
const parsedJson = JSON.parse(json);
const rootUrl = "https://www.colorhexa.com/";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseColorBlindness(str) {
    const firstPass = str.replace(/\t{2,}/g, "\b").split("\b\n\b\n\b\n")
    return firstPass.map((e) => {
        const parsed = e.split("\n\b").filter(e => e !== '')
        return {
            subject: parsed[1].replace(/[\b\n]/g, ""),
            color: parsed[0],
            populationEffect: parsed[2].replace(/[\b\n]/g, "")
        }
    })
}   

function parseHashStrings(str) {
    return str.split("#").filter(e => e !== '')
}

function parseTables(str) {
     const firstPass = str.replace(/\t{2,}/g, " ").split("\n \n ")
     return firstPass.map((e) => {

        if(e === "\n " || e === "") return;
         const split = e.split("\n").filter(e => e !== "")
         
         return {
             subject: split[0].trim(),
             value: split[1].trim()
         }
     });
}


(async () => {
    let i = 0;
    do {


        try {
            
            const obj = {};
            const hex  = parsedJson[i].Hex.replace("#","");
            const html = await rp.get(`${rootUrl}${hex}`);
            const $ = cheerio.load(html);

            obj.description = $('.description').text().replace(/\t{2,}/g, " ").replace(/\n/g, " ")
            obj.colorDescription = $('.color-description').text().replace(/\t{2,}/g, " ").replace(/\n/g, " ");

            const tableLeft = parseTables ( $('.table-conversion.left').text() );
            const tableRight = parseTables( $('.table-conversion.right').text() );
            obj.colorConversion = [...tableLeft, ...tableRight].filter(e => e !== undefined)

            
            /*
            * Schemes 
            */

           obj.colorSchemes = {};
           obj.colorSchemes.complementary = parseHashStrings( $('#complementary ul li a').text() )
           obj.colorSchemes.analogous = parseHashStrings( $('#analogous ul li a').text() )
           obj.colorSchemes.split_complementary = parseHashStrings( $('#split-complementary ul li a').text() )
           obj.colorSchemes.triadic = parseHashStrings( $('#triadic ul li a').text() )
           obj.colorSchemes.tetradic = parseHashStrings( $('#tetradic ul li a').text() )
           obj.colorSchemes.monochromatic =  parseHashStrings( $('#monochromatic ul li a').text() )

           /*
           * Similar
           */ 
           obj.similar = parseHashStrings( $('.similar li a').text() )


           /*
           * Gradients
           */

            obj.gradients = {}
            obj.gradients.shadeVariants = parseHashStrings( $('.gradient li:nth-child(1) a').text() )
            obj.gradients.tintVariants = parseHashStrings( $('.gradient li:nth-child(2) a').text() )

           /*
           * Tones
           */
     

           obj.tones = parseHashStrings( $('#tones .gradients ul li a').text() )
           /*
           * Color Blindness
           */ 

           obj.colorBlindness = {};
           obj.colorBlindness.monochromacy = parseColorBlindness( $('#monochromacy li').text() )
           obj.colorBlindness.dichromacy =  parseColorBlindness( $('#dichromacy li').text() )
           obj.colorBlindness.trichromacy = parseColorBlindness( $('#trichromacy li').text() )
         
            
            const newObj = {...obj, ...parsedJson[i]}


            parsedJson[i] = newObj;
            fs.writeFileSync("./newColors.json", JSON.stringify(parsedJson))

           await sleep(2000)

        } catch(e) {
            console.error(e);
            console.error(`Skip`);
        }

        i++;
    } while(i <= parsedJson.length);

})()





