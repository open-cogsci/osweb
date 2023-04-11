import Transfer from '../../osweb/system/transfer'
import Runner from '../../osweb/system/runner'
import { osexpString } from '../_helpers/testExps'

const mockUpdateIntroScreen = jest.fn()
const mockAddMessage = jest.fn()
const mockAddError = jest.fn()
const mockPoolAdd = jest.fn()
const mockBuildFn = jest.fn()

jest.mock('../../osweb/system/runner', () => {
  return jest.fn().mockImplementation(() => {
    return {
      _screen: {
        _updateIntroScreen: mockUpdateIntroScreen
      },
      _debugger: {
        addMessage: mockAddMessage,
        addError: mockAddError
      },
      _pool: {
        add: mockPoolAdd
      },
      _build: mockBuildFn
    }
  })
})

const transfer = new Transfer(new Runner())

describe('Transfer class', () => {
  beforeEach(() => {
    Runner.mockClear()
    mockUpdateIntroScreen.mockClear()
    mockAddMessage.mockClear()
    mockAddError.mockClear()
    mockPoolAdd.mockClear()
    mockBuildFn.mockClear()
  })

  describe('_readSource', () => {
    it('Should log an error if an invalid or no source is supplied', () => {
      const invalidParams = [null, true, 5, {}, [], new FileReader()]
      for (const param of invalidParams) {
        expect(transfer._readSource(param)).rejects.toThrow()
      }
    })
  })

  describe('_readExpFile', () => {
    it('Should throw an error if an invalid osexp representation is supplied', () => {
      expect(transfer._readExpFile('abc')).rejects.toThrow()
    })

    it('Should recognize a valid script and update the status bar', () => {
      expect(transfer._readExpFile(osexpString)).resolves.toBe(osexpString)
    })
  })

  describe('fetch', () => {
    it('Should throw an error if url is invalid or unavailable', async () => {
      await expect(transfer.fetch()).rejects.toThrow()
    })
  })
})
