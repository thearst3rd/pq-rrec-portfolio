// PlatinumQuest replay porfolio
// by thearst3rd

const express = require("express")
const app = express()
const path = require("path")
const fs = require("fs")
const Handlebars = require("handlebars")

// Default configuration. These properties can be overrided by creating a file "config.json"
let config = {
	port: 3000,
	title: "PlatinumQuest Replay Portfolio",
}

try {
	let newConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")).toString())
	for (const key in newConfig) {
		config[key] = newConfig[key]
	}
}
catch (err) {
	// no big deal, we just roll with the default
}

const portfolioTemplate = Handlebars.compile(fs.readFileSync(path.join(__dirname, "views", "portfolio.html")).toString())
let replayList, portfolioHtml

generateReplayList()
compileHtml()

function generateReplayList() {
	let newReplayList = [
		{
			filename: "71XWhiteNoise0017465.rrec.zip",
			level: "platinum/data/lbmissions_pq/bonus/WhiteNoise.mcs",
			name: "7-1X: White Noise 00:17.465",
			description: "6th place wtf lmao",
			author: "thearst3rd",
			date: "2022/08/20 00:08",
			video: "https://youtu.be/g8fpdUHoL_U?t=2161",
		},
		{
			filename: "71XWhiteNoise0026124.rrec.zip",
			level: "platinum/data/lbmissions_pq/bonus/WhiteNoise.mcs",
			name: "7-1X: White Noise 00:26.124",
			description: "ok???",
			author: "thearst3rd",
			date: "2022/05/28 19:56",
		},
	]
	replayList = newReplayList
}

function compileHtml() {
	portfolioHtml = portfolioTemplate({
		title: config.title,
		replays: replayList
	})
}

app.get("/", (req, res) => {
	res.send(portfolioHtml)
})

const server = app.listen(config.port, () => {
	console.log("Listening on port " + server.address().port)
})
