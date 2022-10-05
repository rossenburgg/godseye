// this disables auto-hidding 'Back' button
// added 'Req Ready! changed its behaviour
CancelButton.prototype.onNeighborButtonHiddenChange =  function()
	{
		//this.cancelButton.size = this.buttonPositions[
		//	this.buttonPositions[1].children.every(button => button.hidden) ? 1 : 0].size;

		for (let handler of this.cancelButtonResizeHandlers)
			handler(this.cancelButton);
	}
