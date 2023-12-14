import { goerli, polygonMumbai } from 'wagmi/chains'
import { configureChains } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
 
const { chains, publicClient } = configureChains(
  [goerli, polygonMumbai],
  [alchemyProvider({ apiKey: 'yourAlchemyApiKey' })],
)