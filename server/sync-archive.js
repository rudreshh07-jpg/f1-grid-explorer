import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// F1DB CONFIGURATION
// ============================================================

const F1DB_VERSION = process.env.F1DB_VERSION || '2026.11.0'

const ARCHIVE_URL =
  `https://github.com/f1db/f1db/releases/download/v${F1DB_VERSION}/f1db-json-single.zip`

const OUTPUT_FILE = path.join(
  __dirname,
  'archive-data.json'
)

const TEMP_DIR = path.join(
  os.tmpdir(),
  `f1db-${Date.now()}`
)

const ZIP_FILE = path.join(
  TEMP_DIR,
  'f1db-json-single.zip'
)


// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function downloadFile(url, destination) {
  console.log('')
  console.log('Downloading F1DB...')
  console.log(url)
  console.log('')

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'F1-Grid-Explorer/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(
      `F1DB download failed: ${response.status} ${response.statusText}`
    )
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  )

  await fs.writeFile(destination, buffer)

  console.log(
    `Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
  )
}


async function findJsonFiles(directory) {
  const results = []

  async function walk(currentDirectory) {
    const entries = await fs.readdir(
      currentDirectory,
      { withFileTypes: true }
    )

    for (const entry of entries) {
      const fullPath = path.join(
        currentDirectory,
        entry.name
      )

      if (entry.isDirectory()) {
        await walk(fullPath)
      }

      if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith('.json')
      ) {
        results.push(fullPath)
      }
    }
  }

  await walk(directory)

  return results
}


async function loadJson(file) {
  const text = await fs.readFile(
    file,
    'utf8'
  )

  return JSON.parse(text)
}


function getArray(object, possibleNames) {
  for (const name of possibleNames) {
    if (Array.isArray(object?.[name])) {
      return object[name]
    }
  }

  return []
}


function firstNonEmpty(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    ) {
      return value
    }
  }

  return null
}


function getFullName(driver) {
  const directName = firstNonEmpty(
    driver.fullName,
    driver.name
  )

  if (directName) {
    return String(directName)
  }

  const firstName = firstNonEmpty(
    driver.firstName,
    driver.givenName
  )

  const lastName = firstNonEmpty(
    driver.lastName,
    driver.familyName
  )

  return [firstName, lastName]
    .filter(Boolean)
    .join(' ')
}


function getId(item) {
  return firstNonEmpty(
    item.id,
    item.driverId,
    item.constructorId,
    item.constructorRef,
    item.circuitId,
    item.slug
  )
}


// ============================================================
// EXTRACT DRIVERS
// ============================================================

function normalizeDrivers(data) {
  const drivers = getArray(data, [
    'drivers',
    'Drivers',
    'driver'
  ])

  return drivers
    .map((driver) => {
      const name = getFullName(driver)

      return {
        id: getId(driver),

        name,

        firstName: firstNonEmpty(
          driver.firstName,
          driver.givenName
        ),

        lastName: firstNonEmpty(
          driver.lastName,
          driver.familyName
        ),

        nationality: firstNonEmpty(
          driver.nationality,
          driver.country
        ),

        dateOfBirth: firstNonEmpty(
          driver.dateOfBirth,
          driver.birthDate
        ),

        permanentNumber: firstNonEmpty(
          driver.permanentNumber,
          driver.number
        ),

        abbreviation: firstNonEmpty(
          driver.abbreviation,
          driver.code
        ),

        wikipediaUrl: firstNonEmpty(
          driver.wikipediaUrl,
          driver.url
        ),

        status: 'historical'
      }
    })
    .filter(
      (driver) =>
        driver.id &&
        driver.name
    )
}


// ============================================================
// EXTRACT CONSTRUCTORS / TEAMS
// ============================================================

function normalizeConstructors(data) {
  const constructors = getArray(data, [
    'constructors',
    'Constructors',
    'constructor'
  ])

  return constructors
    .map((constructor) => ({
      id: getId(constructor),

      name: firstNonEmpty(
        constructor.name,
        constructor.fullName
      ),

      nationality: firstNonEmpty(
        constructor.nationality,
        constructor.country
      ),

      wikipediaUrl: firstNonEmpty(
        constructor.wikipediaUrl,
        constructor.url
      ),

      status: 'historical'
    }))
    .filter(
      (constructor) =>
        constructor.id &&
        constructor.name
    )
}


// ============================================================
// EXTRACT CIRCUITS
// ============================================================

function normalizeCircuits(data) {
  const circuits = getArray(data, [
    'circuits',
    'Circuits',
    'circuit'
  ])

  return circuits
    .map((circuit) => ({
      id: getId(circuit),

      name: firstNonEmpty(
        circuit.name,
        circuit.fullName
      ),

      country: firstNonEmpty(
        circuit.country,
        circuit.countryName
      ),

      city: firstNonEmpty(
        circuit.city,
        circuit.locality
      ),

      latitude: firstNonEmpty(
        circuit.latitude,
        circuit.lat
      ),

      longitude: firstNonEmpty(
        circuit.longitude,
        circuit.lng,
        circuit.lon
      ),

      wikipediaUrl: firstNonEmpty(
        circuit.wikipediaUrl,
        circuit.url
      ),

      status: 'historical'
    }))
    .filter(
      (circuit) =>
        circuit.id &&
        circuit.name
    )
}


// ============================================================
// MAIN SYNC
// ============================================================

async function main() {
  console.log('')
  console.log('==============================================')
  console.log('        F1 GRID EXPLORER ARCHIVE SYNC')
  console.log('==============================================')
  console.log('')

  console.log(`F1DB version: ${F1DB_VERSION}`)
  console.log('')

  try {
    // ----------------------------------------------------------
    // Create temporary directory
    // ----------------------------------------------------------

    await fs.mkdir(
      TEMP_DIR,
      {
        recursive: true
      }
    )

    // ----------------------------------------------------------
    // Download F1DB
    // ----------------------------------------------------------

    await downloadFile(
      ARCHIVE_URL,
      ZIP_FILE
    )

    // ----------------------------------------------------------
    // Extract ZIP
    // ----------------------------------------------------------

    const extractedDirectory =
      path.join(
        TEMP_DIR,
        'extracted'
      )

    await fs.mkdir(
      extractedDirectory,
      {
        recursive: true
      }
    )

    console.log('')
    console.log('Extracting F1DB...')

    if (process.platform === 'win32') {
      await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-Command',
          `Expand-Archive -LiteralPath '${ZIP_FILE}' -DestinationPath '${extractedDirectory}' -Force`
        ]
      )
    } else {
      await execFileAsync(
        'unzip',
        [
          '-o',
          ZIP_FILE,
          '-d',
          extractedDirectory
        ]
      )
    }

    console.log('Extraction complete.')

    // ----------------------------------------------------------
    // Find JSON files
    // ----------------------------------------------------------

    console.log('')
    console.log('Searching for F1DB JSON files...')

    const jsonFiles =
      await findJsonFiles(
        extractedDirectory
      )

    console.log(
      `Found ${jsonFiles.length} JSON files.`
    )

    if (jsonFiles.length === 0) {
      throw new Error(
        'No JSON files were found inside the F1DB archive.'
      )
    }

    // ----------------------------------------------------------
    // Load JSON files
    // ----------------------------------------------------------

    let drivers = []
    let constructors = []
    let circuits = []

    for (const file of jsonFiles) {
      const fileName =
        path.basename(file).toLowerCase()

      let data

      try {
        data = await loadJson(file)
      } catch {
        continue
      }

      if (
        fileName.includes('driver') ||
        fileName.includes('drivers')
      ) {
        const found =
          normalizeDrivers(data)

        if (found.length > drivers.length) {
          drivers = found
        }
      }

      if (
        fileName.includes('constructor') ||
        fileName.includes('constructors')
      ) {
        const found =
          normalizeConstructors(data)

        if (
          found.length >
          constructors.length
        ) {
          constructors = found
        }
      }

      if (
        fileName.includes('circuit') ||
        fileName.includes('circuits')
      ) {
        const found =
          normalizeCircuits(data)

        if (
          found.length >
          circuits.length
        ) {
          circuits = found
        }
      }
    }

    // ----------------------------------------------------------
    // FALLBACK:
    // Search every JSON object recursively.
    // ----------------------------------------------------------

    if (
      drivers.length === 0 ||
      constructors.length === 0 ||
      circuits.length === 0
    ) {
      console.log('')
      console.log(
        'Direct collection detection was incomplete.'
      )

      console.log(
        'Searching JSON structures recursively...'
      )

      for (const file of jsonFiles) {
        let data

        try {
          data = await loadJson(file)
        } catch {
          continue
        }

        const possibleDrivers =
          findObjectsByKey(
            data,
            [
              'drivers',
              'Drivers'
            ]
          )

        for (const collection of possibleDrivers) {
          const found =
            normalizeDrivers({
              drivers: collection
            })

          if (
            found.length >
            drivers.length
          ) {
            drivers = found
          }
        }


        const possibleConstructors =
          findObjectsByKey(
            data,
            [
              'constructors',
              'Constructors'
            ]
          )

        for (const collection of possibleConstructors) {
          const found =
            normalizeConstructors({
              constructors: collection
            })

          if (
            found.length >
            constructors.length
          ) {
            constructors = found
          }
        }


        const possibleCircuits =
          findObjectsByKey(
            data,
            [
              'circuits',
              'Circuits'
            ]
          )

        for (const collection of possibleCircuits) {
          const found =
            normalizeCircuits({
              circuits: collection
            })

          if (
            found.length >
            circuits.length
          ) {
            circuits = found
          }
        }
      }
    }

    // ----------------------------------------------------------
    // SAFETY CHECK
    // ----------------------------------------------------------

    if (drivers.length === 0) {
      throw new Error(
        'F1DB sync found 0 drivers. Archive was NOT written.'
      )
    }

    if (constructors.length === 0) {
      throw new Error(
        'F1DB sync found 0 constructors. Archive was NOT written.'
      )
    }

    if (circuits.length === 0) {
      throw new Error(
        'F1DB sync found 0 circuits. Archive was NOT written.'
      )
    }

    // ----------------------------------------------------------
    // Create archive object
    // ----------------------------------------------------------

    const archive = {
      source: 'F1DB',
      version: F1DB_VERSION,
      syncedAt: new Date().toISOString(),

      counts: {
        drivers: drivers.length,
        constructors: constructors.length,
        circuits: circuits.length
      },

      drivers,
      constructors,
      circuits
    }

    // ----------------------------------------------------------
    // Save
    // ----------------------------------------------------------

    await fs.writeFile(
      OUTPUT_FILE,
      JSON.stringify(
        archive,
        null,
        2
      ),
      'utf8'
    )

    console.log('')
    console.log('==============================================')
    console.log('             ARCHIVE SYNC SUCCESS')
    console.log('==============================================')
    console.log('')
    console.log(
      `Drivers:       ${drivers.length}`
    )
    console.log(
      `Constructors:  ${constructors.length}`
    )
    console.log(
      `Circuits:      ${circuits.length}`
    )
    console.log('')
    console.log(
      `Saved to: ${OUTPUT_FILE}`
    )
    console.log('')

  } finally {

    // ----------------------------------------------------------
    // Cleanup temporary files
    // ----------------------------------------------------------

    try {
      await fs.rm(
        TEMP_DIR,
        {
          recursive: true,
          force: true
        }
      )
    } catch {
      // Ignore cleanup errors.
    }
  }
}


// ============================================================
// RECURSIVE COLLECTION FINDER
// ============================================================

function findObjectsByKey(
  object,
  keys
) {
  const results = []

  function walk(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return
    }

    if (
      typeof value !== 'object'
    ) {
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item)
      }

      return
    }

    for (const key of Object.keys(value)) {
      const child =
        value[key]

      if (
        keys.includes(key) &&
        Array.isArray(child)
      ) {
        results.push(child)
      }

      walk(child)
    }
  }

  walk(object)

  return results
}


// ============================================================
// RUN
// ============================================================

main().catch((error) => {
  console.error('')
  console.error('==============================================')
  console.error('              ARCHIVE SYNC FAILED')
  console.error('==============================================')
  console.error('')
  console.error(error.message)
  console.error('')
  process.exit(1)
})