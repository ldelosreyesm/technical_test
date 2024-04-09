const fs = require('fs/promises')
const axios = require('axios')
const { glob } = require('glob')
const readFile = async (path, tagExpression) => {
	const data = await fs.readFile(path, { encoding: 'utf8' })
	const tagsArray = tagExpression.match(/(@\w+)/g)
	const firstTag = tagsArray[0]
	return data.includes(firstTag)
}
/**
 * returns an array with the features related to the tag
 * in order to improve the performance in the execution since webdriver takes a long time to perform this process.
 * related bug https://lightrun.com/answers/webdriverio-webdriverio--bug-number-of-workers-created-not-filtered-by-cucumber-tags
 * @param {String} src main path where the features are stored
 * @param {String} tag tag to which you want to match
 */

const getFeaturePathsByTag = async (src, tagExpression) => {
	const featuresFiles = await glob(src + '/**/*.feature', { ignore: 'node_modules/**' })
	let features = []
	for (let path of featuresFiles) {
		if (await readFile(path, tagExpression)) {
			features.push(path)
		}
	}
	return features.sort()
}

/**
 * Get last retry scenario and match { content:  } to avoid cucumber report construction failures in jenkins
 * it rewrites the original JSON file
 * @param {String} pathJson path where the original json report is stored
 */
const normalizeJson = async (pathJson) => {
	const fs = require('fs')
	const files = fs.readdirSync(pathJson)

	const firstFileName = files.slice(-1)[0]
	const regexLastFiles = /.+_(\d+).json/
	const regexReportJson = /(cucumber_json)_(\d+).json/

	const timeFirstFile = firstFileName.includes('report.') ? firstFileName : firstFileName.match(regexLastFiles)[1]

	const jsonReport = []
	files.forEach((file) => {
		if (!regexReportJson.test(file) && regexLastFiles.test(file)) {
			let rawdata = fs.readFileSync(pathJson + file)
			let json = JSON.parse(rawdata)
			jsonReport.push(json[0])
			fs.unlinkSync(pathJson + file)
		}
	})

	fs.writeFileSync(pathJson.concat('original_report.txt'), JSON.stringify(jsonReport))
	try {
		if (process.env.SERVER === 'automated') {
			await sendMetrics(jsonReport)
		}
	} catch (error) {
		console.log('cant send metrics')
	}

	const newJson = jsonReport.map((feature) => {
		feature.elements = feature.elements.filter((element) => {
			element.steps = element.steps.map((step) => {
				step.name = step.name.replace(/___?\s/g, '')
				step.arguments[0] = {
					content: step.arguments.length > 0 ? JSON.stringify(step.arguments[0]) || step.arguments[0].toString() : '',
				}
				return step
			})
			return atob(element.steps.at(-1)?.embeddings?.[0]?.data) !== 'willBeRetried' && element // remove retries
		})
		return feature
	})
	const newJsonName = `cucumber_json_${timeFirstFile}.json`
	// logger.debug(pathJson + newJsonName)
	fs.writeFileSync(pathJson + newJsonName, JSON.stringify(newJson))
	return { pathJson, newJsonName }
}

const sendMetrics = async (features) => {
	const results = []
	features.forEach((feature) => {
		feature.elements.forEach((scenario) => {
			scenario.steps.forEach((step) => {
				results.push({
					featuresName: feature.name,
					featuresDescription: feature.description,
					featureUri: feature.uri,
					browser: feature.metadata.browser.name + ' - ' + feature.metadata.browser.version,
					os: feature.metadata.platform.name + ' - ' + feature.metadata.platform.version,
					device: feature.metadata.device,
					scenarioName: scenario.name,
					scenarioDescription: scenario.description,
					scenarioId: scenario.id,
					joinTags: scenario.tags.map((tag) => tag.name).join(','),
					scenarioTag: scenario.tags.map((tag) => tag.name).at(-1),
					arguments: step.arguments[0] || '',
					embeddings: step.embeddings ? JSON.stringify(step.embeddings[0].data).substring(0, 25) : '',
					keyword: step.keyword,
					stepName: step.name,
					status: step.result.status,
					duration: step.result.duration / 1000000000, // seconds
				})
			})
		})
	})

	await axios({
		method: 'post',
		url: 'https://automatedqastg.qrvey.com/devapi/v4/user/Y5jP4__xb/app/chqZzlJrI/qollect/dataset/efsnrqnsh/pushapi/data/post',
		data: { datasetId: 'efsnrqnsh', data: results },
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': process.env.AUTOMATED_API_KEY,
		},
	})
}

module.exports = {
	getFeaturePathsByTag,
	normalizeJson,
}
