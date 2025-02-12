import { render, screen, fireEvent, act } from "@testing-library/react"
import { MarketSelectorList } from "../MarketSelectorList"
import * as bottomSheetStore from "@/stores/bottomSheetStore"
import * as tradeStore from "@/stores/tradeStore"
import * as marketStore from "@/stores/marketStore"
import * as leftSidebarStore from "@/stores/leftSidebarStore"
import { useInstruments } from "@/hooks/useInstruments"

// Mock the stores and hooks
jest.mock("@/stores/bottomSheetStore", () => ({
  useBottomSheetStore: jest.fn(),
}))

jest.mock("@/stores/tradeStore", () => ({
  useTradeStore: jest.fn(),
}))

jest.mock("@/stores/marketStore", () => ({
  useMarketStore: jest.fn(),
}))

jest.mock("@/stores/leftSidebarStore", () => ({
  useLeftSidebarStore: jest.fn(),
}))

jest.mock("@/hooks/useInstruments", () => ({
  useInstruments: jest.fn(),
}))

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  X: () => <div data-testid="clear-icon">Clear</div>,
  Loader2: () => <div data-testid="loader-icon">Loading</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
})

describe("MarketSelectorList", () => {
  const mockSetBottomSheet = jest.fn()
  const mockSetSymbol = jest.fn()
  const mockSetInstrument = jest.fn()
  const mockSetSelectedMarket = jest.fn()
  const mockSetLeftSidebar = jest.fn()
  const mockMarketGroups = [
    {
      market_name: "synthetic_index",
      instruments: ["R_100", "1HZ100V"],
    },
    {
      market_name: "forex",
      instruments: ["EURUSD", "USDJPY"],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup store mocks
    ;(
      bottomSheetStore.useBottomSheetStore as unknown as jest.Mock
    ).mockReturnValue({
      setBottomSheet: mockSetBottomSheet,
    })
    ;(tradeStore.useTradeStore as unknown as jest.Mock).mockImplementation((selector) => {
      const store = {
        setSymbol: mockSetSymbol,
        setInstrument: mockSetInstrument,
      }
      return selector ? selector(store) : store
    })
    ;(marketStore.useMarketStore as unknown as jest.Mock).mockReturnValue({
      selectedMarket: {
        symbol: "1HZ100V",
        displayName: "Volatility 100 (1s) Index",
        shortName: "100",
        market_name: "synthetic_index",
        isOneSecond: true,
        type: "volatility"
      },
      setSelectedMarket: mockSetSelectedMarket,
    })
    ;(leftSidebarStore.useLeftSidebarStore as unknown as jest.Mock).mockReturnValue({
      setLeftSidebar: mockSetLeftSidebar,
    })

    // Setup useInstruments mock with default successful state
    ;(useInstruments as jest.Mock).mockReturnValue({
      marketGroups: mockMarketGroups,
      isLoading: false,
      error: null,
    })

    // Setup localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe("Loading and Error States", () => {
    it("shows loading spinner when fetching data", () => {
      ;(useInstruments as jest.Mock).mockReturnValue({
        marketGroups: [],
        isLoading: true,
        error: null,
      })

      render(<MarketSelectorList />)
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument()
    })

    it("shows error message when fetch fails", () => {
      const errorMessage = "Failed to fetch markets"
      ;(useInstruments as jest.Mock).mockReturnValue({
        marketGroups: [],
        isLoading: false,
        error: errorMessage,
      })

      render(<MarketSelectorList />)
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe("Market Display", () => {
    it("displays synthetic indices correctly", () => {
      render(<MarketSelectorList />)

      expect(screen.getByText("Volatility 100 Index")).toBeInTheDocument()
      expect(screen.getByText("Volatility 100 (1s) Index")).toBeInTheDocument()
    })

    it("displays forex pairs correctly", () => {
      render(<MarketSelectorList />)

      expect(screen.getByText("EUR/USD")).toBeInTheDocument()
      expect(screen.getByText("USD/JPY")).toBeInTheDocument()
    })

    describe("Search Functionality", () => {
      it("filters markets based on search query", () => {
        render(<MarketSelectorList />)

        const searchInput = screen.getByPlaceholderText(
          "Search markets on Rise/Fall"
        )
        fireEvent.change(searchInput, { target: { value: "EUR" } })

        expect(screen.getByText("EUR/USD")).toBeInTheDocument()
        expect(screen.queryByText("USD/JPY")).not.toBeInTheDocument()
      })

      it("shows no results message for empty search", () => {
        render(<MarketSelectorList />)

        const searchInput = screen.getByPlaceholderText(
          "Search markets on Rise/Fall"
        )
        fireEvent.change(searchInput, { target: { value: "XYZ" } })

        expect(
          screen.getByText('No markets found matching "XYZ"')
        ).toBeInTheDocument()
      })

      it("clears search when X button is clicked", () => {
        render(<MarketSelectorList />)

        const searchInput = screen.getByPlaceholderText(
          "Search markets on Rise/Fall"
        )
        fireEvent.change(searchInput, { target: { value: "EUR" } })

        const clearButton = screen.getByTestId("clear-icon").parentElement
        fireEvent.click(clearButton!)

        expect(searchInput).toHaveValue("")
      })
    })

    describe("Tab Navigation", () => {
      it("switches between market categories", () => {
        render(<MarketSelectorList />)

        // Click Forex tab
        fireEvent.click(screen.getAllByText("Forex")[0])
        expect(screen.getByText("EUR/USD")).toBeInTheDocument()
        expect(
          screen.queryByText("Volatility 100 Index")
        ).not.toBeInTheDocument()

        // Click Derived tab
        fireEvent.click(screen.getByText("Derived"))
        expect(screen.getByText("Volatility 100 Index")).toBeInTheDocument()
        expect(screen.queryByText("EUR/USD")).not.toBeInTheDocument()
      })

      it("shows all markets in All tab", () => {
        render(<MarketSelectorList />)

        fireEvent.click(screen.getByText("All"))
        expect(screen.getByText("EUR/USD")).toBeInTheDocument()
        expect(screen.getByText("Volatility 100 Index")).toBeInTheDocument()
      })
    })

    describe("Favorites Management", () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(["EURUSD"]))
      })

      it("toggles favorites and updates localStorage", () => {
        render(<MarketSelectorList />)

        const starButton = screen.getAllByTestId("star-icon")[1].parentElement
        fireEvent.click(starButton!)

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "market-favorites",
          expect.any(String)
        )
      })

      it("shows only favorites in Favourites tab", () => {
        render(<MarketSelectorList />)

        fireEvent.click(screen.getByText("Favourites"))
        expect(screen.getByText("EUR/USD")).toBeInTheDocument()
        expect(screen.queryByText("USD/JPY")).not.toBeInTheDocument()
      })
    })

    describe("Market Selection", () => {
      it("prevents selection of closed markets", () => {
        render(<MarketSelectorList />)

        const closedMarket = screen.getByText("USD/JPY").closest("div")
        fireEvent.click(closedMarket!)

        expect(mockSetSymbol).not.toHaveBeenCalled()
        expect(mockSetBottomSheet).not.toHaveBeenCalled()
      })

      it("handles market selection correctly", () => {
        render(<MarketSelectorList />)

        const market = screen.getByText("EUR/USD").closest("div")
        fireEvent.click(market!)

        expect(mockSetInstrument).toHaveBeenCalledWith("EURUSD")
        expect(mockSetSelectedMarket).toHaveBeenCalled()
        expect(mockSetBottomSheet).toHaveBeenCalledWith(false)
        expect(mockSetLeftSidebar).toHaveBeenCalledWith(false)
      })

      it("sets initial instrument based on default market", async () => {
        await act(async () => {
          render(<MarketSelectorList />)
        })
        
        expect(mockSetInstrument).toHaveBeenCalledWith("1HZ100V")
      })
    })
  })
})
