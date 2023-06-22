import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3030;

const giphy = {
    url: `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY}&limit=1&q=`,
};

app.use(express.urlencoded());

app.get('/', (req, res) => {
    console.log(req.body);
    res.send('hi');
});

app.post('/', async (req, res) => {

    console.log(req.body.payload);
    console.log(req.body);
    const text = `itysl ${req.body.text}`
    const responseURL = req.body.response_url;

    const response = await fetch(`${giphy.url}${text}`);
    const body = await response.json();

    const responseBody = {
        "replace_original": "true",
        "blocks": [
            {
                "type": "image",
                "image_url": `${body.data[0].images.fixed_height.url}`,
                "alt_text": `${req.body.text}`
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Cancel :exclamation:",
                            "emoji": true
                        },
                        "style": "danger",
                        "value": `kill`,
                        "action_id": "cancel"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Try Again? :skull_and_crossbones:",
                            "emoji": true
                        },
                        "value": `offset=0&query=${text}`,
                        "action_id": "try-again"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Post :arrow_right:",
                            "emoji": true
                        },
                        "style": "primary",
                        "value": `${body.data[0].images.fixed_height.url}`,
                        "action_id": "post"
                    }
                ]
            }
        ]
    };

    res.json(responseBody);
});

app.post('/button', async (req, res) => {
    const responseJSON = JSON.parse(req.body.payload);

    console.log(responseJSON);

    let responseBody = {};

    let responseURL = responseJSON.response_url;

    if (responseJSON.actions[0].action_id === 'cancel') {
        responseBody.delete_original = "true";
    } else if (responseJSON.actions[0].action_id === 'post') {
        responseBody = {
            "token": `${process.env.SLACK_TOKEN}`,
            "channel": responseJSON.channel.id,
            "blocks": [
                {
                    "type": "image",
                    "image_url": `${responseJSON.actions[0].value}`,
                    "alt_text": ''
                }
            ]
        };
        const sendResponse = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'post',
            body: JSON.stringify(responseBody),
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': `Bearer ${process.env.SLACK_TOKEN}`
            }
        });

        const sendResult = await sendResponse.json();
        console.log(sendResult);

        responseBody = {
            'delete_original':"true"
        };
    } else {
        let [count, query] = responseJSON.actions[0].value.split('&');
        count = parseInt(count.substr(7));
        count += 1;
    
        query = query.substr(6);
    
        const response = await fetch(`${giphy.url}itysl ${query}&offset=${count}`);
        const body = await response.json();
    
        responseBody = {
            "replace_original": "true",
            "blocks": [
                {
                    "type": "image",
                    "image_url": `${body.data[0].images.fixed_height.url}`,
                    "alt_text": `${query}`
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Cancel :exclamation:",
                                "emoji": true
                            },
                            "style": "danger",
                            "value": `kill`,
                            "action_id": "cancel"
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Try Again? :skull_and_crossbones:",
                                "emoji": true
                            },
                            "value": `offset=${count}&query=${query}`,
                            "action_id": "try-again"
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Post",
                                "emoji": true
                            },
                            "value": `${body.data[0].images.fixed_height.url}`,
                            "action_id": "post"
                        }
                    ]
                }
            ]
        };
    }


    console.log(responseBody);
    const sendResponse = await fetch(responseURL, {
        method: 'post',
        body: JSON.stringify(responseBody),
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
        }
    });

    const sendBody = await sendResponse.json();
    console.log(sendBody);

    res.send();
});

app.listen(port, '0.0.0.0', () => {
    console.log('howdy doody'); 
    console.log(`Server started on 0.0.0.0 on port ${port}`);
});