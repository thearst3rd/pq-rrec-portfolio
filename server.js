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
	rrecDirectory: "recordings", // I really wanted to name this "dirrectory", but alas, good programming practices...
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
	let newReplayList = []
	let rrecFilenames = fs.readdirSync(config.rrecDirectory)
	for (const i in rrecFilenames) {
		const filename = rrecFilenames[i]
		const fullFilePath = path.join(config.rrecDirectory, filename)
		const stats = fs.statSync(fullFilePath)
		if (stats.isFile()) {
			let dateString = stats.birthtime.toISOString()
			dateString = dateString.replace("T", " ").substring(0, dateString.length - 5)
			newReplayList.push({
				filename: filename,
				date: dateString,
			})
		}
	}
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

app.use("/recordings", express.static(config.rrecDirectory))

const server = app.listen(config.port, () => {
	console.log("Listening on port " + server.address().port)
})
