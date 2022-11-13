// PlatinumQuest replay porfolio
// by thearst3rd

const PORT = 3000

const express = require("express")
const app = express()
const path = require("path")

app.use(express.static(path.join(__dirname, "public")))

const server = app.listen(PORT, () =>
{
	console.log("Listening on port " + server.address().port)
})
