const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

module.exports = {
    name: 'clone',
    description: 'Clone un site web et envoie le fichier HTML dans le canal Discord.',
    async execute(client, message, args) {  // Ajoutez `client` ici
        if (!args.length) {
            return message.channel.send('Veuillez fournir une URL à cloner.');
        }

        let websiteUrl = args[0];
        if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
            websiteUrl = 'https://' + websiteUrl;
        }

        try {
            const response = await axios.get(websiteUrl);
            const htmlContent = response.data;
            const $ = cheerio.load(htmlContent);

            const inlineAssets = async () => {
                const baseUrl = new URL(websiteUrl);

                const cssLinks = $('link[rel="stylesheet"]');
                let allCss = '';

                for (let i = 0; i < cssLinks.length; i++) {
                    const cssUrl = new URL($(cssLinks[i]).attr('href'), baseUrl);
                    try {
                        const cssResponse = await axios.get(cssUrl.href);
                        allCss += cssResponse.data + '\n';
                    } catch (error) {
                        console.error('Erreur lors de la récupération du CSS :', error);
                    }
                }

                if (allCss) {
                    $('head').append(`<style>${allCss}</style>`);
                    cssLinks.remove();
                }

                const scriptLinks = $('script[src]');
                let allJs = '';

                for (let i = 0; i < scriptLinks.length; i++) {
                    const jsUrl = new URL($(scriptLinks[i]).attr('src'), baseUrl);
                    try {
                        const jsResponse = await axios.get(jsUrl.href);
                        allJs += jsResponse.data + '\n';
                    } catch (error) {
                        console.error('Erreur lors de la récupération du JS :', error);
                    }
                }

                if (allJs) {
                    $('body').append(`<script>${allJs}</script>`);
                    scriptLinks.remove();
                }
            };

            await inlineAssets();

            const fileName = ($('title').text().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'site_clone') + '.html';
            const filePath = path.join(__dirname, 'cloned_sites', fileName);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, $.html(), 'utf8');

            await message.channel.send({
                content: `Le site web a été cloné avec succès :`,
                files: [filePath]
            });

            fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Erreur lors du clonage du site web :', error);
            message.channel.send('Une erreur est survenue lors du clonage du site web.');
        }
    },
};