import { MongoClient, type Db } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'calendario_planeacion'

const globalMongo = globalThis as unknown as {
  mongo?: Promise<MongoClient>
  indices?: Promise<void>
}

export function mensajeMongo(): string {
  return `No hay conexión con MongoDB en ${uri}. Inicia el servicio local y ábrelo con Compass. La base es ${dbName}; las colecciones proyectos y actividades aparecen al crear el primer proyecto.`
}

export function esErrorDeConexion(error: unknown): boolean {
  const texto = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /ECONNREFUSED|MongoServerSelection|MongoNetwork|ENOTFOUND|timed out|Topology/i.test(texto)
}

async function conectar(): Promise<MongoClient> {
  if (!globalMongo.mongo) {
    const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 })
    globalMongo.mongo = cliente.connect().catch((error: unknown) => {
      globalMongo.mongo = undefined
      throw error
    })
  }

  return globalMongo.mongo
}

export async function getDb(): Promise<Db> {
  const cliente = await conectar()
  const db = cliente.db(dbName)

  if (!globalMongo.indices) {
    globalMongo.indices = db
      .collection('actividades')
      .createIndex({ proyectoId: 1 })
      .then(() => undefined)
      .catch((error: unknown) => {
        globalMongo.indices = undefined
        throw error
      })
  }

  await globalMongo.indices
  return db
}
