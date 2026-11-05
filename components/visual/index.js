// The one-page visual guides that exist, by guide slug. A guide gets a /visual/<slug>/ page, and
// tools/build-visuals.mjs a PDF and PNG, only once it has a sheet here.
import alignment from "./alignment"
import attention from "./attention"
import embeddings from "./embeddings"
import finetuning from "./finetuning"
import inference from "./inference"
import neuralNetworks from "./neural-networks"
import nextToken from "./next-token"
import pretraining from "./pretraining"
import tokenizer from "./tokenizer"
import transformer from "./transformer"

export const sheets = { "neural-networks": neuralNetworks, tokenizer, embeddings, attention, transformer, "next-token": nextToken, pretraining, finetuning, alignment, inference }
