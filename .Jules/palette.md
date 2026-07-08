## YYYY-MM-DD - [Add tooltip to disabled button]
**Learning:** In order to display a custom Tooltip on a disabled button, we must wrap the button in a div (`<div className="w-full">`) because disabled elements do not fire the necessary hover/pointer events to trigger the tooltip.
**Action:** Next time I need to add a tooltip on a disabled element, I will remember to wrap it in a pointer-events-enabled parent like a div.
