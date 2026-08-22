1. **Goal:** Improve UX by replacing the native `title` attribute on the disabled "Test Voice" button with a Radix UI `Tooltip`. Native tooltips often don't work reliably on disabled buttons in all browsers, and Radix Tooltips offer better accessibility and styling. Additionally, we will wrap the disabled button in a `span` with `tabIndex={0}` when disabled so that keyboard users and screen readers can access the tooltip explaining *why* it's disabled.
2. **Steps:**
   - Open `src/components/VolumeControlDialog.tsx`.
   - Import `Tooltip`, `TooltipContent`, `TooltipProvider`, and `TooltipTrigger` from `@/components/ui/tooltip`.
   - Locate the "Test Voice" `<Button>`.
   - Wrap the `<Button>` in `<TooltipProvider><Tooltip>`.
   - Use `<TooltipTrigger asChild>` but since a disabled button blocks pointer events, wrap the button inside a `<span tabIndex={0} className="w-full">` (if disabled) or just always wrap it, wait, `asChild` means the immediate child gets the props. So we need a wrapper around the `Button` if it's disabled.
     ```tsx
     <TooltipTrigger asChild>
       <div tabIndex={voiceVolume === 0 ? 0 : undefined} className="w-full flex">
         <Button ... className="w-full ..." />
       </div>
     </TooltipTrigger>
     ```
   - Actually, a cleaner way is just wrapping the button in `<span>` only when disabled, or always wrap in a `<div tabIndex={0} className="w-full">` and pass `asChild` to `<TooltipTrigger>`.
   - Wait, if we put `tabIndex={0}` on a div, keyboard focus will go to the div, then to the button (if not disabled). To avoid double focus, only add `tabIndex={0}` if `voiceVolume === 0`.
   - Add `<TooltipContent>` with the message "Increase volume to test voice" (when disabled) or "Test voice volume" (when enabled).
   - Verify the changes using `pnpm lint` (or repo equivalent like `npm run lint`).
   - Run tests `npm run test`.
3. **Pre-commit Instructions:** Follow instructions from `pre_commit_instructions`.
