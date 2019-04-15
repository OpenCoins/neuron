import { getConnection } from 'typeorm'
import { Cell, OutPoint } from '../cell'
import TransactionEntity from '../entities/Transaction'
import { getHistoryTransactions } from '../mock_rpc'

export interface Input {
  previousOutput: OutPoint
  args: string[]
  validSince?: number
}

export interface Witness {
  data: string[]
}

export interface Transaction {
  hash: string
  version: number
  deps?: OutPoint[]
  inputs?: Input[]
  outputs?: Cell[]
  timestamp?: string
  value?: string
  blockNumber?: string
  blockHash?: string
  witnesses?: Witness[]
  type?: string
}

export interface TransactionsByAddressesParam {
  pageNo: number
  pageSize: number
  addresses: string[]
}

export interface TransactionsByLockHashesParam {
  pageNo: number
  pageSize: number
  lockHashes: string[]
}

export interface TransactionsByPubkeysParams {
  pageNo: number
  pageSize: number
  pubkeys: string[]
}

export interface PaginationResult<T = any> {
  totalCount: number
  items: T[]
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
export default class TransactionsService {
  public static getAll = async (params: TransactionsByLockHashesParam): Promise<PaginationResult<Transaction>> => {
    // TODO: calculate lockHashes when saving transactions
    const totalCount = await TransactionEntity.count()
    const connection = getConnection()
    const skip = (params.pageNo - 1) * params.pageSize
    const transactions = await connection
      .getRepository(TransactionEntity)
      .createQueryBuilder('tx')
      .skip(skip)
      .take(params.pageSize)
      .getMany()

    const txs: Transaction[] = transactions!.map(tx => ({
      timestamp: tx.timestamp,
      value: tx.value,
      hash: tx.hash,
      version: tx.version,
      type: tx.type,
    }))

    return {
      totalCount: totalCount || 0,
      items: txs,
    }
  }

  public static getAllByAddresses = async (
    params: TransactionsByAddressesParam,
  ): Promise<PaginationResult<Transaction>> => {
    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes: [],
    })
  }

  public static getAllByPubkeys = async (
    params: TransactionsByPubkeysParams,
  ): Promise<PaginationResult<Transaction>> => {
    return TransactionsService.getAll({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      lockHashes: [],
    })
  }

  public static get = async (hash: string): Promise<Transaction | undefined> => {
    const transaction = await TransactionEntity.findOne(hash)
    return transaction
  }

  // check whether the address has history transactions
  public static hasTransactions = (_address: string): boolean => {
    return Math.random() >= 0.5
  }

  public static create = async (transaction: Transaction): Promise<TransactionEntity> => {
    const tx = new TransactionEntity()
    tx.hash = transaction.hash
    tx.version = transaction.version
    tx.deps = transaction.deps!
    tx.inputs = transaction.inputs!
    tx.outputs = transaction.outputs!
    tx.timestamp = transaction.timestamp!
    tx.value = transaction.value!
    tx.blockHash = transaction.blockHash!
    tx.blockNumber = transaction.blockNumber!
    tx.witnesses = transaction.witnesses!
    tx.type = transaction.type!
    const txEntity = await tx.save()
    return txEntity
  }

  /* eslint no-await-in-loop: "warn" */
  // NO parallel
  public static loadTransactionsHistoryFromChain = async (lockHashes: string[]) => {
    // TODO: to => get_tip_block_number
    const to = 1000
    let currentFrom = 0
    let currentTo = to
    while (currentFrom <= to) {
      currentTo = Math.min(currentFrom + 100, to)
      const txs = await getHistoryTransactions(lockHashes, currentFrom.toString(), currentTo.toString())
      await TransactionsService.convertTransactions(txs)
      currentFrom = currentTo + 1
    }
  }

  public static convertTransactions = async (transactions: Transaction[]): Promise<TransactionEntity[]> => {
    const txEntities: TransactionEntity[] = []

    transactions.forEach(async tx => {
      const txEntity = await TransactionsService.convertTransactionAndCreate(tx)
      txEntities.push(txEntity)
    })

    return txEntities
  }

  public static convertTransactionAndCreate = async (transaction: Transaction): Promise<TransactionEntity> => {
    const tx: Transaction = transaction
    // TODO: calculate value, sum of not return charge output
    tx.value = Math.round(Math.random() * 10000).toString()
    tx.type = ['send', 'receive', 'unknown'][Math.round(Math.random() * 2)]
    const txEntity = await TransactionsService.create(transaction)
    return txEntity
  }

  public static generateTx = async () => {
    const inputs: Input[] = [
      {
        previousOutput: {
          hash: '0xb2becaa4e71e43abc75d1a87280b63df4dceaae1716540faf65e38925d2f641d',
          index: 0,
        },
        args: [],
        validSince: 0,
      },
    ]

    const outputs = [
      {
        capacity: '1000',
        data: '',
        lock: {
          binary_hash: '0x8bddddc3ae2e09c13106634d012525aa32fc47736456dba11514d352845e561d',
          args: [
            '0x65323139336466353164373834313136303137393662333562313762346638663263643835626430616461383834326166323365303836633136396133316432',
          ],
        },
      },
      {
        capacity: '49000',
        data: '',
        lock: {
          binary_hash: '0x8bddddc3ae2e09c13106634d012525aa32fc47736456dba11514d352845e561d',
          args: [
            '0x33366333323965643633306436636537353037313261343737353433363732616461623537663463366664333661373134393633303534353662623239386462',
          ],
        },
      },
    ]

    return {
      version: 0,
      deps: [
        {
          hash: '0x8d37f0856ebb70c12871830667d82224e6619896c7f12bb73a14dd9329af9c8d',
          index: 0,
        },
      ],
      inputs,
      outputs,
    }
  }
}
