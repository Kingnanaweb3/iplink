# IPlink

**Creators cannot borrow against income they cannot prove. IPlink makes it provable.**

## Links

* Live app: https://iplink.online
* Browse campaigns: https://iplink.online/app
* Technical write up: https://iplink.online/docs/iplink-technical-integration.html
* User guide: https://iplink.online/docs/iplink-user-guide.html
* Pitch deck: https://iplink.online/docs/iplink-pitch-deck.pdf
* Repository: https://github.com/Kingnanaweb3/iplink

Built for BUIDL CTC 2026 Fall, RWA track.

## The problem, in plain terms

A bank will lend you money against a house. It can send someone to stand in front of that house, confirm it exists, and estimate what it is worth.

Nobody can do that with a music catalog.

A musician earning two thousand dollars a month from streaming has genuinely earned it. But a bank cannot audit Spotify's payout ledger, and a lender on a blockchain cannot read a distributor's private database. The income is real. It is simply unprovable to anyone outside.

So the money sits there, recurring every month, useless as collateral. The creator's only options are to sell the catalog outright or go without capital.

This is not a small group of people. More than two hundred million people now earn something as creators. Over half of them make under fifteen thousand dollars a year, which is well below the point where any financing company will even look at them, because checking their income by hand costs more than the deal is worth.

## What IPlink does

IPlink stops trying to read anyone's private database.

Instead, revenue has to arrive as a payment on a blockchain. Once money moves on a blockchain it leaves a permanent public record that nobody can forge, edit, or quietly delete.

That changes the question. It is no longer "can we trust this dashboard?" It becomes "did this transaction happen?" And that second question has a mathematical answer rather than a trust based one.

A creator opens a campaign and offers a share of future revenue. Investors fund it. When real revenue arrives, it gets proven on chain, and only then are investors paid. Once they have been repaid an agreed amount, the arrangement ends and everything reverts to the creator.

The creator keeps the catalog the whole time. They sell a slice of income for a period, never the asset itself.

## How the proof works

Think of an inclusion proof as a receipt that cannot be faked.

When a payment happens on one blockchain, thousands of independent computers have already agreed it happened and written it into a permanent record. An inclusion proof is a compact piece of evidence showing that one specific payment sits inside that record.

The useful part is that you can hand this evidence to someone who was not there, on a completely different blockchain, and they can check the mathematics themselves. They never have to take your word for anything.

That is what the **Attestcoin Protocol** generates, and what **Creditcoin** verifies.

## The four steps

1. **A payment lands.** Revenue arrives on a source chain. In this build that is Ethereum Sepolia, standing in for a distributor paying royalties out.
2. **A proof is generated.** The Attestcoin Protocol produces cryptographic evidence that this exact payment was included in a real block.
3. **Creditcoin verifies it.** The Block Prover precompile checks the proof on chain, in roughly one block.
4. **The payout unlocks.** Only now is revenue recorded, the investor share calculated, and the money made claimable.

Nothing moves until step three passes. There is no moment where anyone has to be trusted.

## Why anyone can submit a proof

The verification function has no access control. A creator can call it. An investor can call it. A complete stranger can call it.

This looks strange until you notice what is actually being trusted. It is not the person submitting. It is the proof itself, which is checked by the blockchain before a single line of business logic runs. A creator cannot fabricate a payment, and an investor never needs permission to prove one.

## The attested credit record

Every verified payment becomes a permanent entry in that creator's history.

It works like a credit score, with one important difference. On a normal credit report, entries are submitted by institutions and you hope they got it right. Here, every single line exists only because a payment was cryptographically proven. The creator cannot add an entry. Nobody can.

An investor checks this record before funding anyone. Over time it becomes something a creator carries with them into their next raise.

This is the part that matters most. The marketplace demonstrates the idea, but the record itself is the real primitive, and eventually any lending protocol could underwrite against it.

## Why Creditcoin

Creditcoin exists to make credit history verifiable on chain, so that a proven track record can do the job collateral usually does. It was built for borrowers no institution could underwrite.

That is exactly the creator's situation, in a different asset class. Creditcoin was not chosen because it was available. It was chosen because the problem was already the same one.

## Technical integration

`Campaign.sol` inherits `USCBase`, Creditcoin's reference pattern for Attestcoin smart contracts. When `execute()` is called with a proof:

1. A query ID is computed and checked against replay protection.
2. The proof is verified by the Block Prover precompile at `0x0FD2`, covering Merkle inclusion plus a continuity chain.
3. Only if verification passes does business logic run.
4. The transaction is decoded with Gluwa's `EvmV1Decoder`. The contract confirms the receipt succeeded, the event came from the registered `RoyaltyPayer`, the event names this specific campaign, and the creator matches.
5. Revenue is credited and the payout becomes claimable.

Verification and business logic happen in the same transaction. There is no asynchronous callback and no intermediate state anyone has to trust.

Proof generation runs on a small Node service in `/relay`, because the Gluwa SDK is written for Node and the prover API is not set up for browser origins. The relay only generates proofs. It holds no keys and cannot move funds.

## Deployed contracts

All on public testnets. Tokens have no market value.

* **RoyaltyPayer** on Ethereum Sepolia: `0xC8DA25fCd256Cd1642F83c78a0ccbD1bC65e52A5`
* **CampaignFactory** on Creditcoin CC3: `0x5748fAf08a3e543841b2b2c6E677d4fb5F7EC6F1`
* **Campaign, Mira Royalty Share** on Creditcoin CC3: `0x52Ee0b89eD2255850dE9e8B75C2808B84aB9c82c`
* **Campaign, Nova Forge Share** on Creditcoin CC3: `0xEF3E6889C4a4d3c8EBD85E4148Da596aE5f4c815`

Explorers:

* Creditcoin: https://creditcoin-testnet.blockscout.com
* Sepolia: https://sepolia.etherscan.io

## Repository layout

```
contracts/   Solidity contracts, Hardhat setup, tests, deploy scripts
frontend/    React and Vite app plus the landing page
relay/       Node service that generates Attestcoin inclusion proofs
```

### The contracts

* `Campaign.sol` handles funding, verified revenue recording, payouts, and refunds. Inherits `USCBase`.
* `RevenueShareToken.sol` is an ERC20 representing a share of revenue. Non transferable, explained under Security.
* `CampaignFactory.sol` deploys campaigns and validates their terms.
* `RoyaltyPayer.sol` is the source chain stand in for a distributor paying royalties.
* `USCBase.sol` and `VerifierInterface.sol` are Creditcoin's reference contracts, used unmodified.

## Running it locally

You will need Node 18 or later, a wallet holding Sepolia ETH and Creditcoin testnet CTC, and RPC access to both chains.

```bash
git clone https://github.com/Kingnanaweb3/iplink.git
cd iplink
```

Contracts:

```bash
cd contracts
npm install
cp .env.example .env    # fill in private keys and RPC URLs
npx hardhat compile
npx hardhat test
```

Relay:

```bash
cd relay
npm install
npm start               # listens on port 8787
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

To point the frontend at a local relay rather than the hosted one, add this to `frontend/.env`:

```
VITE_RELAY_URL=http://localhost:8787/generate-proof
```

## Security

We audited our own contracts, found ten issues, several of them severe, and fixed all of them. Every fix has a test. Run `npx hardhat test` to see them pass.

The worst one was a **share token drain**. Payout accounting tracks how much each holder has already claimed. Moving tokens to a fresh wallet reset that counter to zero, which let the new wallet claim the entire revenue history again, repeatedly, using other investors' money. Share tokens are now non transferable.

Also fixed: capital release over withdrawal, the same proof being counted in two campaigns, investing twice erasing your earlier earnings, missing refunds, campaigns showing as fully repaid when they were not, permanent bricking by an oversized payment, creators investing in themselves, and rounding dust.

Every campaign also holds a **forty percent reserve**, so investor payouts do not depend on a creator choosing to deposit funds later. It works like a security deposit that the contract holds rather than the creator.

### What is not solved

A creator can take their sixty percent, never verify any revenue, and walk away. Investors would recover at most the reserve. No smart contract can force somebody to earn money. This is unsecured revenue share financing and that risk is real. The honest fixes are releasing capital in stages tied to verified revenue, or legal recourse.

Separately, restricting who can originate a payment stops outsiders fabricating revenue, but an approved creator could still pay themselves. The real fix is pointing at a distributor's genuine payout contract, established once when the creator is onboarded. That cannot be simulated on a testnet.

Both are documented rather than hidden. Full detail is in the [technical write up](https://iplink.online/docs/iplink-technical-integration.html).

## Known limitations

* Share tokens cannot be traded. A secondary market needs checkpointed balances.
* Source chain revenue amounts map one to one onto Creditcoin accounting units. Production would need a proper settlement asset design.
* Attestcoin currently supports Ethereum mainnet and Sepolia as source chains.
* Campaign titles and descriptions live in the frontend rather than on chain.

## Stack

Solidity 0.8.28, Hardhat 3, React 19, Vite, wagmi and viem, ethers v6, `@gluwa/usc-sdk`, `@gluwa/usc-contracts`.
