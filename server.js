// PlatinumQuest replay porfolio
// by thearst3rd

const express = require("express")
const app = express()
const path = require("path")
const fs = require("fs")
const Handlebars = require("handlebars")
const Zip = require("adm-zip")

// Default configuration. These properties can be overrided by creating a file "config.json"
let config = {
	port: 3000,
	title: "PlatinumQuest Replay Portfolio",
	rrecDirectory: "recordings", // I really wanted to name this "dirrectory", but alas, good programming practices...
	serveRecordings: true, // Set to false if you'll be hosting the files with another service (e.g. nginx)
	downloadUrl: null,
	excludeFiles: ["lb-current.rrec", "lb-latest.rrec"],
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

let downloadUrl = "recordings"
if (config.downloadUrl)
	downloadUrl = config.downloadUrl

let replayList, portfolioTemplate, portfolioHtml

function readReplayHeader(filename) {
	let buf
	if (filename.endsWith(".zip")) {
		const zipFile = new Zip(filename)
		if (zipFile.getEntryCount() < 1)
			return null
		buf = zipFile.getEntries()[0].getData()
	}
	else {
		buf = fs.readFileSync(filename)
	}

	const replayHeader = {}
	let offset = 0
	replayHeader.version = buf.readInt16LE(offset)
	offset += 2
	replayHeader.gameVersion = buf.readInt16LE(offset)
	offset += 2
	const missionFileLength = buf.readUInt8(offset)
	offset += 1
	replayHeader.missionFile = buf.toString("ascii", offset, offset + missionFileLength)
	offset += missionFileLength
	const marbleSelectionLength = buf.readUInt8(offset)
	offset += 1
	replayHeader.marbleSelection = buf.toString("ascii", offset, offset + marbleSelectionLength)
	offset += marbleSelectionLength
	const flags = buf.readUInt8(offset)
	offset += 1
	replayHeader.flags = {
		hasMetadata: (flags & 1) == 1,
		lb: (flags & 2) == 2,
		mp: (flags & 4) == 4,
	}

	if (replayHeader.flags.hasMetadata) {
		const authorLength = buf.readUInt8(offset)
		offset += 1
		replayHeader.author = buf.toString("ascii", offset, offset + authorLength)
		offset += authorLength
		const nameLength = buf.readUInt8(offset)
		offset += 1
		replayHeader.name = buf.toString("ascii", offset, offset + nameLength)
		offset += nameLength
		const descriptionLength = buf.readUInt16LE(offset)
		offset += 2
		replayHeader.description = buf.toString("ascii", offset, offset + descriptionLength)
		offset += descriptionLength
	}

	replayHeader.sprngSeed = buf.readUInt32LE(offset)
	offset += 4

	return replayHeader
}

function generateReplayList() {
	let newReplayList = []
	let rrecFilenames = fs.readdirSync(config.rrecDirectory)
	console.log("Reading replay files")
	for (const i in rrecFilenames) {
		const naturalIndex = parseInt(i) + 1
		if ((naturalIndex % 100 === 0) || (naturalIndex === rrecFilenames.length))
			console.log("%d/%d", naturalIndex, rrecFilenames.length)

		const filename = rrecFilenames[i]
		if (config.excludeFiles.includes(filename))
			continue
		const fullFilePath = path.join(config.rrecDirectory, filename)
		const stats = fs.statSync(fullFilePath)
		if (!stats.isFile())
			continue

		const replayHeader = readReplayHeader(fullFilePath)
		if (replayHeader == null)
			continue

		let dateString = stats.mtime.toISOString()
		dateString = dateString.replace("T", " ").substring(0, dateString.length - 5)

		let missionFileWithBreaks = ""
		for (let c of replayHeader.missionFile) {
			if (c === "/")
				missionFileWithBreaks += "\u200B" // Zero-width space
			missionFileWithBreaks += c
		}

		newReplayList.push({
			filename: filename,
			mission: missionFileWithBreaks,
			missionFile: replayHeader.missionFile,
			name: (replayHeader.name === undefined) ? filename : replayHeader.name,
			description: replayHeader.description,
			author: replayHeader.author,
			date: dateString,
		})
	}
	replayList = newReplayList
}

function compilePortfolioTemplate() {
	console.log("Compiling template")
	portfolioTemplate = Handlebars.compile(fs.readFileSync(path.join(__dirname, "views", "portfolio.html")).toString())
}

function generateHtml() {
	console.log("Generating HTML")
	portfolioHtml = portfolioTemplate({
		title: config.title,
		downloadUrl: downloadUrl,
		hasVideos: false,
		replays: replayList,
	})
}

generateReplayList()
compilePortfolioTemplate()
generateHtml()

fs.watch(path.join(__dirname, "views", "portfolio.html"), (eventType, filename) => {
	console.log("File %s modified: %s", filename, eventType)
	compilePortfolioTemplate()
	generateHtml()
})

app.get("/", (req, res) => {
	res.send(portfolioHtml)
})

if (config.serveRecordings) {
	app.use("/" + downloadUrl, express.static(config.rrecDirectory))
}

const server = app.listen(config.port, () => {
	console.log("Listening on port " + server.address().port)
})
