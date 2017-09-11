## Members

<dl>
<dt><a href="#getOwner">getOwner</a> ⇒</dt>
<dd><p>Get owner of token contract</p>
</dd>
<dt><a href="#getTotalSupply">getTotalSupply</a> ⇒</dt>
<dd><p>Get total supply of token contract</p>
</dd>
<dt><a href="#getTokenBalance">getTokenBalance</a> ⇒</dt>
<dd><p>Get token balance of owner</p>
</dd>
<dt><a href="#transferToken">transferToken</a> ⇒</dt>
<dd><p>Transfer amount of token from sender to receiver</p>
</dd>
<dt><a href="#transferTokens">transferTokens</a> ⇒</dt>
<dd><p>Transfer amount of each token in the tokens array from sender to receiver</p>
</dd>
<dt><a href="#mintToken">mintToken</a> ⇒</dt>
<dd><p>Mint amount of token for the receiver. Only works if minter is the owner of the token</p>
</dd>
<dt><a href="#finishMinting">finishMinting</a> ⇒</dt>
<dd><p>Finish minting period for the token contract. Only works if sender is the owner of the token</p>
</dd>
<dt><a href="#baseUnits">baseUnits</a> ⇒</dt>
<dd><p>Convert ERC20 units (=number of base units times 10^decimals) to base units</p>
</dd>
<dt><a href="#ERC20Units">ERC20Units</a> ⇒</dt>
<dd><p>Convert base units (=number of ERC20 units divided by 10^decimals) to ERC20 units</p>
</dd>
<dt><a href="#claimTokens">claimTokens</a> ⇒</dt>
<dd><p>Allocates (presale) tokens to the sender</p>
</dd>
</dl>

<a name="getOwner"></a>

## getOwner ⇒
Get owner of token contract

**Kind**: global variable  
**Returns**: owner  

| Param |
| --- |
| token | 

<a name="getTotalSupply"></a>

## getTotalSupply ⇒
Get total supply of token contract

**Kind**: global variable  
**Returns**: total supply  

| Param |
| --- |
| token | 

<a name="getTokenBalance"></a>

## getTokenBalance ⇒
Get token balance of owner

**Kind**: global variable  
**Returns**: token balance  

| Param |
| --- |
| token | 
| owner | 

<a name="transferToken"></a>

## transferToken ⇒
Transfer amount of token from sender to receiver

**Kind**: global variable  
**Returns**: transaction receipt  

| Param |
| --- |
| token | 
| sender | 
| receiver | 
| amount | 

<a name="transferTokens"></a>

## transferTokens ⇒
Transfer amount of each token in the tokens array from sender to receiver

**Kind**: global variable  
**Returns**: transaction receipts  

| Param |
| --- |
| token | 
| sender | 
| receiver | 
| amount | 

<a name="mintToken"></a>

## mintToken ⇒
Mint amount of token for the receiver. Only works if minter is the owner of the token

**Kind**: global variable  
**Returns**: transaction receipt  

| Param |
| --- |
| contract | 
| minter | 
| receiver | 
| amount | 

<a name="finishMinting"></a>

## finishMinting ⇒
Finish minting period for the token contract. Only works if sender is the owner of the token

**Kind**: global variable  
**Returns**: transaction receipt  

| Param |
| --- |
| token | 
| sender | 

<a name="baseUnits"></a>

## baseUnits ⇒
Convert ERC20 units (=number of base units times 10^decimals) to base units

**Kind**: global variable  
**Returns**: base units  

| Param |
| --- |
| token | 
| amount | 

<a name="ERC20Units"></a>

## ERC20Units ⇒
Convert base units (=number of ERC20 units divided by 10^decimals) to ERC20 units

**Kind**: global variable  
**Returns**: ERC20 units  

| Param |
| --- |
| token | 
| amount | 

<a name="claimTokens"></a>

## claimTokens ⇒
Allocates (presale) tokens to the sender

**Kind**: global variable  
**Returns**: transaction receipt  

| Param |
| --- |
| token | 
| sender | 

