import { dialog } from 'electron'
import { distinctUntilChanged } from 'rxjs/operators'
import { NetworkType, NetworkID, Network, NetworkWithID } from 'types/network'
import NetworksService from 'services/networks'
import NodeService from 'services/node'
import { ResponseCode } from 'utils/const'
import { IsRequired, InvalidName, NetworkNotFound, CurrentNetworkNotSet } from 'exceptions'
import { switchToNetwork } from 'block-sync-renderer'
import { CurrentNetworkIDSubject, NetworkListSubject } from 'models/subjects/networks'
import i18n from 'utils/i18n'
import ChainInfo from './chain-info'
import logger from 'utils/logger'

const networksService = NetworksService.getInstance()

NodeService
  .getInstance()
  .connectionStatusSubject
  .pipe(distinctUntilChanged())
  .subscribe(async (connected: boolean) => {
    if (connected) {
      logger.debug('Network reconnected')
      NetworksController.connectToNetwork(networksService.getCurrent(), true)
    } else {
      logger.debug('Network connection dropped')
    }
  })

export default class NetworksController {
  public static async startUp() {
    const network = networksService.getCurrent()
    await NetworksController.connectToNetwork(network)

    NetworksController.notifyListChange()
    CurrentNetworkIDSubject.next({ currentNetworkID: network.id })
  }

  public static getAll() {
    const networks = networksService.getAll()
    return {
      status: ResponseCode.Success,
      result: networks,
    }
  }

  public static get(id: NetworkID) {
    if (typeof id === 'undefined') {
      throw new IsRequired('ID')
    }

    const network = networksService.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }

    return {
      status: ResponseCode.Success,
      result: network,
    }
  }

  public static async create({ name, remote, type = NetworkType.Normal }: Network) {
    if (!name || !remote) {
      throw new IsRequired('Name and address')
    }
    if (name === 'error') {
      throw new InvalidName('Network')
    }

    const created = await networksService.create(name, remote, type)
    NetworksController.notifyListChange()

    return {
      status: ResponseCode.Success,
      result: created,
    }
  }

  public static async update(id: NetworkID, options: Partial<Network>) {
    if (options.name && options.name === 'error') {
      throw new InvalidName('Network')
    }

    await networksService.update(id, options)

    if (networksService.getCurrentID() === id) {
      CurrentNetworkIDSubject.next({ currentNetworkID: id })
      await NetworksController.connectToNetwork(networksService.get(id)!)
    }
    NetworksController.notifyListChange()

    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  public static async delete(id: NetworkID) {
    const network = networksService.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }
    const currentID = networksService.getCurrentID()

    const messageValue = await dialog.showMessageBox(
      {
        type: 'warning',
        title: i18n.t(`messageBox.remove-network.title`),
        message: i18n.t(`messageBox.remove-network.message`, {
          name: network.name,
          address: network.remote,
        }),
        detail: currentID === id ? i18n.t('messageBox.remove-network.alert') : '',
        buttons: [i18n.t('messageBox.button.confirm'), i18n.t('messageBox.button.discard')],
      }
    )

    if (messageValue.response === 0) {
      try {
        networksService.delete(id)

        if (id === currentID) {
          const newCurrentNetwork = networksService.getCurrent()
          CurrentNetworkIDSubject.next({ currentNetworkID: newCurrentNetwork.id })
          await NetworksController.connectToNetwork(network)
        }

        NetworksController.notifyListChange()

        return {
          status: ResponseCode.Success,
          result: true,
        }
      } catch (err) {
        dialog.showMessageBox({
          type: 'error',
          message: err.message,
        })
      }
    }
  }

  public static currentID() {
    const currentID = networksService.getCurrentID()
    if (currentID) {
      return {
        status: ResponseCode.Success,
        result: currentID,
      }
    }
    throw new CurrentNetworkNotSet()
  }

  public static async activate(id: NetworkID) {
    await networksService.activate(id)
    const network = networksService.get(id)!
    CurrentNetworkIDSubject.next({ currentNetworkID: id })
    await NetworksController.connectToNetwork(network)

    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  private static notifyListChange() {
    NetworkListSubject.next({ currentNetworkList: networksService.getAll() })
  }

  static async connectToNetwork(network: NetworkWithID, reconnected: boolean = false) {
    await new ChainInfo(network).load()
    await switchToNetwork(network, reconnected)
  }
}
