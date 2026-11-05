// The one-page visual guides that exist, by guide slug. A guide gets a /visual/<slug>/ page, and
// tools/build-visuals.mjs a PDF and PNG, only once it has a sheet here.
import finetuning from "./finetuning"
import neuralNetworks from "./neural-networks"

export const sheets = { "neural-networks": neuralNetworks, finetuning }
