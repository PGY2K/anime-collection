const MAT_RELEASES = [
  {
    version: "v6.3.3",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Profile customization color choices now display the full actual color across each option tile with larger, bolder labels.",
        "Customization menus now size to their content and only scroll when a category, such as Avatar, genuinely requires it."
      ],
      FIXED: [
        "Fixed most color options appearing as plain dark tiles while only Orange displayed a visible color preview."
      ]
    }
  },
  {
    version: "v6.3.2",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Simplified the RP Shop into six focused category mockups for Avatar, Avatar Decoration, Background, Recommendation Panel, Top 5 Panel, and Mini Profile Card.",
        "Each category now previews only the item being customized, making the Shop easier to navigate."
      ],
      FIXED: [
        "Fixed mini profile card colors so the selected color fills the entire card background instead of only changing its outline."
      ]
    }
  },
  {
    version: "v6.3.1",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Rebuilt the Shop as a full-screen live view of your actual profile.",
        "Added small gear controls for Avatar, Avatar Decoration, Background, Recommendation Panel, and Top 5 Panel.",
        "Added a clearly visible mini profile card preview below the full profile with its own gear control.",
        "Renamed PFP to Avatar throughout the profile customization experience."
      ],
      FIXED: [
        "Fixed the mini profile card preview not appearing in the current Shop layout."
      ]
    }
  },
  {
    version: "v6.3.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "The RP Shop now has a full profile designer",
    announcement: "Customize your profile and mini profile card on a dedicated Shop page, preview every change, then purchase and equip everything together.",
    groups: {
      NEW: [
        "Added a dedicated RP Shop page with a live full-profile preview and mini profile card preview.",
        "Added Red, Blue, Green, Pink, Orange, and Black mini profile card backgrounds.",
        "Mini profile card colors start at 2,500 RP and double after every color purchase."
      ],
      IMPROVED: [
        "The RP Shop button now opens the full Shop page instead of placing the designer inside the RP menu.",
        "All selected owned and unowned cosmetics are reviewed together before Purchase and Equip.",
        "Equipped mini card colors display across Following, Followers, Requests, and Recommended user cards."
      ]
    }
  },
  {
    version: "v6.2.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "Find more anime fans to follow",
    announcement: "The Following page now recommends three community members and shows follower counts on social profile cards.",
    groups: {
      NEW: [
        "Added a Recommended section with three users you may want to follow.",
        "Recommendations prioritize mutual connections, then popular community members."
      ],
      IMPROVED: [
        "Replaced RP totals with follower counts on Following, Followers, Requests, and Recommended user cards.",
        "Recommended users refresh automatically after following someone."
      ]
    }
  },
  {
    version: "v6.1.3",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Badge progress access is now shown only on your own profile."
      ],
      REMOVED: [
        "Removed the Badges progress button when viewing another user’s profile while keeping their earned badges visible."
      ]
    }
  },
  {
    version: "v6.1.2",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      NEW: [
        "Added Follow and Unfollow controls directly to user profiles.",
        "Private-profile follow requests now change from Follow to Requested."
      ],
      IMPROVED: [
        "Moved each user's friend code below their username in smaller, lighter text."
      ],
      REMOVED: [
        "Removed friend-code copy buttons from profile headers and Profile Settings."
      ]
    }
  },
  {
    version: "v6.1.1",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      NEW: [
        "Added Advanced Rating to the whole-franchise rating menu."
      ],
      FIXED: [
        "Removed the inactive franchise-rating information icon.",
        "Updated profile copy buttons to show a checkmark, tooltip confirmation, and clipboard toast after copying."
      ],
      IMPROVED: [
        "Moved the franchise-rating explanation into the rating menu.",
        "Advanced franchise ratings now apply every category score and the calculated average to all franchise entries and synchronized rating displays."
      ]
    }
  },
  {
    version: "v6.1.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "Franchise ratings and profile code copying are live",
    announcement: "Rate an entire franchise at once, copy friend codes directly from profiles, and receive emergency announcements reliably across MAT.",
    groups: {
      NEW: [
        "Added a whole-franchise rating control that applies one score to every entry.",
        "Added copy buttons beside usernames on personal and followed-user profiles.",
        "Added an information guide explaining how franchise and entry ratings interact."
      ],
      FIXED: [
        "Restored the emergency banner across MAT pages with automatic refresh behavior."
      ],
      IMPROVED: [
        "Changing an individual entry now recalculates the franchise average.",
        "Franchise rating changes synchronize collection cards, Top 5, recommendations, and other rating displays."
      ]
    }
  },
  {
    version: "v6.0.2",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Moved all PFP selection out of Profile Settings so profile appearance is managed only through the RP Shop.",
        "Restored Avatar Decoration as its own RP Shop category with neon PFP rings starting at 500 RP and doubling after each purchase.",
        "Made signup PFP cards substantially larger on desktop and mobile so each character is easy to identify before selecting."
      ]
    }
  },
  {
    version: "v6.0.1",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      FIXED: [
        "Fixed broken PFP images by placing every avatar and the fallback image in the exact asset paths used by signup, profiles, navigation, comments, and the RP Shop."
      ]
    }
  },
  {
    version: "v6.0.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "A new PFP collection and progressive RP Shop are here",
    announcement: "New members can choose one character PFP for free, then unlock more PFPs and profile cosmetics through the RP Shop with category-based progressive pricing.",
    groups: {
      NEW: [
        "Added 24 categorized character PFPs across eight anime series.",
        "New users can choose any one PFP during account creation, and that PFP becomes their first permanently unlocked avatar.",
        "Added PFP ownership, purchasing, and equipping to the RP Shop."
      ],
      IMPROVED: [
        "Profile customization now shows only PFPs the user has unlocked.",
        "The default image is now reserved for loading and error fallback instead of being selectable.",
        "Added independent progressive prices: PFPs start at 50 RP, backgrounds at 500 RP, and Top 5 and Recommendation cosmetics at 1,000 RP, with each category doubling after every purchase."
      ]
    }
  },
  {
    version: "v5.9.2",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "The MAT homepage is now the starting point",
    announcement: "New and signed-out visitors now begin on the public MAT homepage, where they can see the app in action before choosing to sign in or create an account.",
    groups: {
      NEW: [
        "Added a See MAT in Action button that smoothly moves visitors from the hero section to the visual MAT feature previews."
      ],
      IMPROVED: [
        "Confirmed the public landing page is the default homepage for signed-out visitors while signed-in users continue directly to their Dashboard.",
        "Changed sign out behavior so users return to the public MAT homepage instead of being sent directly to the login page."
      ]
    }
  },
  {
    version: "v5.9.1",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "The MAT homepage now shows real anime artwork",
    announcement: "The public homepage previews now use recognizable anime posters and the extra progress section has been removed for a cleaner introduction to MAT.",
    groups: {
      IMPROVED: [
        "Replaced the letter-based landing page poster placeholders with real anime cover artwork throughout the Dashboard, Collection, Ratings, recommendations, profile Top 5, and mobile previews.",
        "Removed the Always remember where you stopped section to keep the public homepage focused and easier to scan.",
        "Renumbered the remaining landing page feature sections after removing the progress preview."
      ]
    }
  },
  {
    version: "v5.9.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "Welcome to the new MAT homepage",
    announcement: "New and signed-out visitors can now see exactly how MAT helps track, organize, rate, and discover anime before creating an account.",
    groups: {
      NEW: [
        "Added a complete public landing page for new and signed-out visitors.",
        "Added visual previews of the Dashboard, Collection, anime progress, Ratings, friend recommendations, profiles, and mobile experience.",
        "Added clear Create Account and Sign In actions throughout the public homepage."
      ],
      IMPROVED: [
        "Signed-in users continue directly to their normal Dashboard while signed-out users remain on the public homepage.",
        "Explained MAT's main purpose through realistic interface previews instead of relying on text alone.",
        "Added responsive layouts so the new homepage works across desktop, tablet, and mobile screens."
      ]
    }
  },
  {
    version: "v5.8.6",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      FIXED: [
        "Changed the mobile RP Shop into one continuous scrolling view so no section remains pinned to the screen.",
        "Removed the fixed and sticky behavior from both the Recommendation Points controls and the Purchase and Equip section."
      ],
      IMPROVED: [
        "The RP Shop header, tabs, profile preview, customization controls, totals, and purchase button now scroll together naturally on mobile."
      ]
    }
  },
  {
    version: "v5.8.5",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      FIXED: [
        "Restored the View Updates button so the What's New window opens correctly again.",
        "Fixed the RP Shop purchase bar so it remains visible at the bottom while customizing on mobile."
      ],
      IMPROVED: [
        "Changed the Recommendation Points heading, description, and navigation tabs to scroll normally with the RP Shop on mobile.",
        "Removed the mobile layout behavior that kept the top of the RP menu occupying the screen while the shop content scrolled beneath it."
      ]
    }
  },
  {
    version: "v5.8.4",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Replaced the cramped RP Shop category tabs with separate category bubbles that clearly show each selected color.",
        "Added a focused color menu that closes automatically after a selection so the live profile preview is immediately visible again."
      ],
      FIXED: [
        "Removed glow effects from the Top 5 and recommendation header bars and text.",
        "Kept Top 5 and recommendation neon outlines limited to the anime poster and content-card areas."
      ]
    }
  },
  {
    version: "v5.8.3",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Rebuilt the RP Shop into a compact profile designer with category tabs and small color controls.",
        "Reduced the RP balance icon and condensed the live preview so profile customization fits on desktop and mobile without unnecessary scrolling."
      ],
      FIXED: [
        "Fixed Top 5 glow selections so neon outlines apply to the section heading and every Top 5 card.",
        "Fixed recommendation glow selections so neon outlines apply to the recommendation heading and card.",
        "Removed the oversized RP gem from the Shop layout while keeping a compact balance indicator."
      ]
    }
  },
  {
    version: "v5.8.2",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Changed profile background rewards from blended gradients to complete solid-color profile themes.",
        "Matched Top 5 and recommendation header backgrounds to the profile background selected by the profile owner.",
        "Reworked all customization effects into crisp neon outlines with the glow radiating from the border."
      ],
      FIXED: [
        "Fixed profile-picture rewards so they render as a visible neon ring around the avatar.",
        "Removed the dark, discolored fill from glowing Top 5 and recommendation headers."
      ]
    }
  },
  {
    version: "v5.8.1",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Rebuilt the RP Shop as a live profile designer instead of a long product list.",
        "Added a full profile preview that changes immediately while selecting avatar, background, Top 5, and recommendation colors.",
        "Added one Purchase and Equip action with pending cost, current balance, and remaining balance totals.",
        "Owned colors and Restore Default can be equipped without being charged again."
      ],
      FIXED: [
        "Connected equipped shop selections to the actual profile customization classes used on personal and public profiles.",
        "Strengthened every glow effect so profile backgrounds, avatars, Top 5 posters, and recommendations visibly change color.",
        "Added compatibility for alternate customization field names returned by existing database functions."
      ]
    }
  },
  {
    version: "v5.8.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "The RP Shop is open",
    announcement: "Spend your RP on permanent profile glows for your picture, background, Top 5, and recommendation.",
    groups: {
      NEW: [
        "Opened the RP Shop with red, blue, green, pink, black, and white glow customizations.",
        "Added separate profile-picture, profile-background, Top 5, and recommendation glow categories.",
        "Purchased colors stay permanently unlocked and can be equipped again for free.",
        "Added a free Restore Default option to every customization category."
      ],
      IMPROVED: [
        "Each customization costs 500 RP and the balance is deducted only when the purchase succeeds.",
        "Purchases are checked and completed securely so RP cannot fall below zero or be charged twice for the same item.",
        "Added a MAT popup when a user does not have enough RP for a transaction.",
        "Profile customizations are visible to anyone who is already allowed to view that profile and do not change existing privacy rules."
      ]
    }
  },
  {
    version: "v5.7.4",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      FIXED: [
        "Suspended accounts are now signed out immediately when they attempt to sign in or restore an existing session.",
        "Replaced the previous suspended-account text notice with a MAT-styled Account Suspended popup.",
        "Added the suspended-account check to protected-page session restoration so access cannot continue after a refresh."
      ]
    }
  },
  {
    version: "v5.7.3",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      FIXED: [
        "Replaced browser confirmation prompts in Admin Controls with a MAT-styled confirmation window.",
        "Fixed moderation actions failing when database output fields had the same names as profile columns.",
        "Applied the moderation database repair to account suspension, comment privilege, and username privilege actions.",
        "Fixed follow-backs being blocked by an older relationship rule that treated both follow directions as duplicates."
      ]
    }
  },
  {
    version: "v5.7.2",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      FIXED: [
        "Fixed user profiles failing to open because the Admin Controls permission check was referenced before it was loaded.",
        "Fixed follow-back requests failing when the friendship table did not have the unique sender-and-receiver rule required by the follow function."
      ],
      IMPROVED: [
        "The follow repair safely removes duplicate relationship rows before adding the required uniqueness protection."
      ]
    }
  },
  {
    version: "v5.7.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "New account moderation tools",
    announcement: "MAT now has stronger tools to keep profiles, usernames, and community discussions safe.",
    groups: {
      NEW: [
        "Added owner-only Admin Controls to every viewed user profile.",
        "Added permanent account suspension, comment privilege controls, and username privilege controls.",
        "Added required admin notes and permanent action history searchable by friend code."
      ],
      IMPROVED: [
        "Suspended accounts keep their email reserved while public account data is removed.",
        "Revoking comment access permanently removes previous comments and can later be restored without restoring deleted content.",
        "Revoking username access replaces the public username with the friend code and prevents further username changes.",
        "Added database-enforced permission checks and moderation audit records for every action."
      ]
    }
  },
  {
    version: "v5.6.1",
    date: "July 2026",
    isAnnouncement: false,
    groups: {
      IMPROVED: [
        "Removed provider branding from all user-facing text, announcements, errors, and historical changelog entries.",
        "Removed Franchise Options from Profile Settings because the same controls are available on franchise title pages.",
        "Replaced the expanded Franchise Options section on franchise pages with a compact Filter button that opens and closes the existing entry visibility controls."
      ]
    }
  },
  {
    version: "v5.6.0",
    date: "July 2026",
    isAnnouncement: true,
    announcementTitle: "Finding anime is faster",
    announcement: "Add Anime now searches while you type, posters open the title page, and What's New alerts you when a major announcement is available.",
    groups: {
      NEW: [
        "Added live anime search results that refresh automatically while the user types.",
        "Made search-result posters clickable so users can open the anime title page and its resolved franchise before adding it.",
        "Added an unread red-dot indicator to What's New when a major announcement has not been opened."
      ],
      IMPROVED: [
        "Added a 300 millisecond debounce to reduce unnecessary search requests while preserving responsive search.",
        "Prevented slower, outdated search responses from replacing results for newer text.",
        "Removed the manual Search button while preserving Enter as an immediate-search shortcut.",
        "Changed release-note policy so every release appears in Changelog, while only major user-facing releases appear under Announcements.",
        "Opening What's New stores the latest viewed announcement version and clears the red dot until another major announcement is published."
      ]
    }
  },
  {
    version: "v5.5.1",
    date: "July 2026",
    announcementTitle: "Franchise ratings stay accurate",
    announcement: "Franchise display options no longer change recommendation ratings. Only rated entries count toward the score.",
    groups: {
      FIXED: [
        "Separated Franchise Options visibility filters from franchise rating and recommendation calculations.",
        "Franchise ratings now use every rated entry assigned to the franchise, even when all entry formats are hidden from the Entries list.",
        "Prevented active franchise recommendations from receiving a null rating when visibility settings hide every displayed entry."
      ],
      IMPROVED: [
        "Unrated franchise entries are ignored instead of being treated as zero.",
        "The Entries list still follows the user's visibility preferences without changing the stored franchise score."
      ]
    }
  },
  {
    version: "v5.5.0",
    date: "July 2026",
    announcementTitle: "Recommendations are simpler",
    announcement: "Rate a title first, then recommend it using that saved rating. Recommendation ratings can no longer conflict with your personal ratings.",
    groups: {
      FIXED: [
        "Removed the editable recommendation-rating controls that could conflict with anime and franchise rating calculations.",
        "Stopped recommendation saves from rewriting anime status, personal ratings, franchise status, or calculated franchise ratings.",
        "Added validation that blocks anime and franchise recommendations until the item is completed and has a saved rating."
      ],
      IMPROVED: [
        "Anime recommendations now use the anime's existing personal rating as a read-only source.",
        "Franchise recommendations now use the calculated overall franchise rating as a read-only source.",
        "Recommendation updates now change only the note and active recommendation while preserving the existing one-way personal-rating refresh behavior."
      ]
    }
  },
  {
    version: "v5.4.9",
    date: "July 2026",
    announcementTitle: "Recommendation ratings now save correctly",
    announcement: "Updating either your personal rating or your active recommendation rating now keeps both values matched and saved everywhere.",
    groups: {
      FIXED: [
        "Fixed recommendation-rating edits being overwritten by the previously saved personal rating.",
        "Added an atomic database function that saves the submitted rating to both the collection record and matching active recommendation.",
        "Updated anime and franchise rating flows to use the newly submitted value as the source of truth before refreshing the page."
      ],
      IMPROVED: [
        "Personal-rating changes now update the matching active recommendation after the collection save succeeds.",
        "Recommendation-rating changes now persist to the personal rating and active recommendation before the interface reloads.",
        "Rating synchronization remains separate from RP award logic and cannot create duplicate first-rating or exact-match rewards."
      ]
    }
  },

  {
    version: "v5.4.8",
    date: "July 2026",
    announcementTitle: "RP history and recommendation ratings are more accurate",
    announcement: "RP History now shows the correct point totals, and your recommendation rating always stays matched with your personal rating.",
    groups: {
      FIXED: [
        "Fixed RP History totals being multiplied when a title had multiple recommendation records.",
        "Changed the history query to count each unique RP award event exactly once before grouping totals by anime or franchise."
      ],
      IMPROVED: [
        "Synchronized active anime recommendation ratings with the recommender's personal anime rating in both directions.",
        "Synchronized active franchise recommendation ratings with the recommender's personal franchise rating in both directions.",
        "Added guarded database triggers so rating synchronization does not loop or create duplicate RP rewards."
      ]
    }
  },

  {
    version: "v5.4.7",
    date: "July 2026",
    announcementTitle: "The RP menu has more options",
    announcement: "You can now learn how RP works, preview the upcoming Shop, and see how many points each recommendation has earned.",
    groups: {
      NEW: [
        "Changed the RP popup into a three-button menu with How RP Works, Shop, and History views.",
        "Added an RP Shop placeholder that encourages users to save points while profile rewards are being prepared.",
        "Added grouped recommendation history showing total RP per anime or franchise and separate user and point totals for Added, Completed, Rated, and Rating Match events.",
        "Added the protected get_my_recommendation_rp_history database function so users can only retrieve their own earned recommendation history."
      ],
      IMPROVED: [
        "Updated RP navigation labels and accessibility text to describe the full RP menu instead of only the earning guide.",
        "Kept the What's New announcement short and user-friendly while retaining implementation details in the Changelog."
      ]
    }
  },

  {
    version: "v5.4.6",
    date: "July 2026",
    announcementTitle: "Emergency banners are easier to read",
    announcement: "Important MAT messages now match the site theme and scroll with a clear break before repeating.",
    groups: {
      IMPROVED: [
        "Changed the global emergency banner from red styling to MAT's dark purple theme.",
        "Removed the automatic Emergency Message prefix and ensured an unused banner starts completely blank.",
        "Rebuilt the ticker animation so one message fully leaves the screen before the next loop begins.",
        "Removed the duplicate ticker copy that caused the end and beginning of a message to run together.",
        "Established a simpler, user-friendly announcement format for What's New while keeping technical detail in the Changelog."
      ]
    }
  },

  {
    version: "v5.4.5",
    date: "July 2026",
    announcementTitle: "Franchise options are easier to reach and emergency notices are now available",
    announcement: "Franchise Options now appear directly above the Entries list on franchise pages, and the MAT owner can publish a scrolling Emergency Banner across every screen. View the Changelog tab for the complete details.",
    groups: {
      NEW: [
        "Added Franchise Options directly to the top of the Entries section on franchise pages.",
        "Added an owner-only Emergency Banner control with Save Banner and Clear Banner actions.",
        "Emergency messages display as a one-line, continuously scrolling ticker across the top of every MAT screen for all users.",
        "The global banner stays active until the owner clears it and disappears completely when no message is saved."
      ],
      IMPROVED: [
        "Franchise-page options use the same saved profile preferences as Settings, keeping both locations synchronized.",
        "Saving Franchise Options immediately reloads the Entries list so the selected formats are shown without a manual refresh.",
        "Emergency Banner updates are delivered live to open MAT sessions when Supabase Realtime is available."
      ],
      SECURITY: [
        "Only the existing MAT owner account can save or clear the Emergency Banner; all users have read-only access to the displayed message."
      ]
    }
  },

  {
    version: "v5.4.4",
    date: "July 2026",
    announcementTitle: "First-rating match rules and owner RP controls are now live",
    announcement: "Exact Rating Match RP is now decided only when a follower submits their first rating, and later rating edits cannot trigger the +10 bonus. The MAT owner also has a private Admin Control Panel tool for adding or removing RP from a user by friend code. View the Changelog tab for the complete details.",
    groups: {
      NEW: [
        "Added an owner-only Recommendation Points adjustment tool to the Admin Control Panel.",
        "The owner can find a user by friend code, choose Add Points or Remove Points, enter an amount, and save the adjustment without replacing the user's balance.",
        "Added a protected audit log for every manual RP adjustment, including the owner, target user, operation, amount, previous balance, new balance, and timestamp."
      ],
      FIXED: [
        "Exact Rating Match is now evaluated only on the follower's first saved rating.",
        "If the first rating does not match the recommender, changing it later to the matching score awards no +10 RP.",
        "If the first rating matches, the recommender receives the +5 Rated reward and the +10 Exact Rating Match reward, subject to existing attribution, duplicate, and 24-hour protections.",
        "Manual point removal can never reduce a user's RP balance below zero."
      ],
      SECURITY: [
        "Both the Admin Control Panel and the RP adjustment database function verify the existing MAT owner permission; normal users cannot view or execute the tool."
      ]
    }
  },

  {
    version: "v5.4.3",
    date: "July 2026",
    announcementTitle: "Completion and rating RP rewards are now connected",
    announcement: "Recommendation attribution now remains active after a title is added, allowing recommenders to receive the Completed, Rated, and Exact Rating Match rewards when the follower updates that title later. Duplicate and 24-hour protections remain in place. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Connected anime and franchise status updates to the +3 Completed RP event.",
        "Connected anime and franchise rating saves to the +5 Rated RP event.",
        "Added the +10 Exact Rating Match check using the rating saved in the viewer’s collection.",
        "Preserved profile-only attribution and dashboard splitting among the followed recommenders captured when the title was added.",
        "Kept one-time event protection and the rolling 19 RP per viewer-to-recommender limit."
      ]
    }
  },

  {
    version: "v5.4.2",
    date: "July 2026",
    announcementTitle: "Recommendation collection status is now consistent",
    announcement: "Recommendation cards now check the current viewer’s collection every time the dashboard or a followed user’s profile loads. Titles already added show In Your Collection everywhere, while duplicate RP protection remains unchanged. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Fixed followed-user profile recommendation cards showing Add to Queue after the viewer had already added the title from the dashboard or title page.",
        "Dashboard and profile recommendation cards now use the same live collection-state check for anime and franchises.",
        "Recommendation buttons immediately switch to In Your Collection after a successful add and remain non-clickable on future page loads.",
        "Preserved the existing database duplicate protection so revisiting an outdated page or repeating an add attempt cannot award another +1 RP."
      ]
    }
  },

  {
    version: "v5.4.1",
    date: "July 2026",
    announcementTitle: "Recommendation RP credit and collection removal are fixed",
    announcement: "Adding a recommended title to the queue now uses one database action that adds the title, preserves attribution, and awards the +1 RP credit. Remove from Collection is also available on anime and franchise pages. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Replaced the separate queue insert and RP steps with one database function so a successful recommended add cannot silently skip the +1 RP reward.",
        "Validated that RP is awarded only to users with an active recommendation for the exact anime or franchise.",
        "Added duplicate protection so the same viewer cannot award the Added RP event more than once for the same title and recommender."
      ],
      NEW: [
        "Added Remove from Collection to franchise detail pages with a confirmation prompt.",
        "Protected active recommendations from being removed from the collection until the recommendation is removed or replaced.",
        "Anime and franchise removal now preserve the active-recommendation rules consistently."
      ]
    }
  },

  {
    version: "v5.4.0",
    date: "July 2026",
    announcementTitle: "Recommended franchises can now be added correctly",
    announcement: "Recommended franchise pages now distinguish an unowned title from a queued title. Followers see Add to Queue, and using it preserves recommendation attribution so the eligible recommender receives RP. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Removed the false Queued status shown when a follower opened a recommended franchise that was not in their collection.",
        "Added a visible Add to Queue button for recommended franchises that the viewer does not own.",
        "Add to Queue now creates the viewer's user_franchises record with Queued status instead of treating a missing row as already queued.",
        "Recommendation attribution is recorded before the collection insert so the eligible profile recommender or followed dashboard recommender group receives the +1 RP add credit and remains eligible for later RP events."
      ]
    }
  },

  {
    version: "v5.3.9",
    date: "July 2026",
    announcementTitle: "Recommended franchises now open for followers",
    announcement: "Followers can now open a recommended franchise from a profile or dashboard even when it is not already in their own collection. Recommendation attribution remains attached while they browse the title. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Fixed the Unexpected Error shown when a follower opened a recommended franchise they had not added to their own collection.",
        "Franchise recommendation links now load the public franchise catalog and entries without requiring a matching user_franchises row for the viewer.",
        "Recommendation handoff data is restored from session storage so dashboard and profile attribution remains available on the franchise page.",
        "Status and recommendation management controls remain hidden until the viewer actually has the franchise in their own collection."
      ]
    }
  },

  {
    version: "v5.3.8",
    date: "July 2026",
    announcementTitle: "Recommendation title links now use a verified handoff",
    announcement: "Recommendation cards now store their verified title and attribution data before opening the title page. The title page can recover from an invalid stored ID, and credit is saved when the follower actually adds the title. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Rebuilt profile and dashboard recommendation clicks to use a verified title ID instead of relying on a fragile generated route.",
        "Added a session handoff containing the recommendation title, source, and eligible recommender IDs before navigation.",
        "Added title-based recovery on the anime page when an older recommendation contains an invalid or missing title ID.",
        "Recommendation attribution is now written when Add to Collection is completed, while opening the title page preserves the source without prematurely awarding credit."
      ]
    }
  },

  {
    version: "v5.3.7",
    date: "July 2026",
    announcementTitle: "Recommendation links now open the correct title page",
    announcement: "Recommendation posters and titles on followed-user profiles and the dashboard now use a validated title ID with a title fallback, so followers can open the title page without the unexpected error while recommendation credit remains attached. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Fixed profile recommendation posters and titles opening an invalid anime route.",
        "Fixed dashboard recommendation posters and titles showing the unexpected error after being clicked.",
        "Recommendation links now validate stored IDs and fall back to resolving the title through the anime database when an older recommendation record is missing its title ID.",
        "Preserved profile and dashboard recommendation attribution when the title page is opened before Add to Queue is used."
      ]
    }
  },

  {
    version: "v5.3.6",
    date: "July 2026",
    announcementTitle: "Recommendation cards now keep artwork, links, and credit",
    announcement: "Recommendation cards on profiles and the dashboard now resolve their poster artwork, open the correct title page, and include Add to Queue attribution so recommenders keep credit. View the Changelog tab for the complete details.",
    groups: {
      NEW: [
        "Added an Add to Queue button to recommendation cards on followed-user profiles and the dashboard.",
        "Recommendation source information now travels with title links so adding from the title page still credits the correct recommender or followed recommender group."
      ],
      FIXED: [
        "Fixed missing recommendation poster artwork by resolving media from the stored title ID with a title-search fallback.",
        "Fixed recommendation cards opening an invalid title route and showing an unexpected error.",
        "Dashboard attribution remains limited to recommenders the viewing user follows; profile attribution credits only the profile owner."
      ]
    }
  },

  {
    version: "v5.3.5",
    date: "July 2026",
    announcementTitle: "Active recommendations are now protected and removable",
    announcement: "MAT now prevents active recommendations from being changed away from Completed and adds a Remove Recommendation option directly inside the Recommended menu. View the Changelog tab for the complete details.",
    groups: {
      NEW: [
        "Added a Remove Recommendation button when opening the active Recommended menu on anime and franchise pages."
      ],
      IMPROVED: [
        "Active recommended titles and franchises must remain Completed until the recommendation is removed or replaced.",
        "Removed the extra Your active recommendation label; the ✓ Recommended button now provides the full visual state."
      ]
    }
  },

  {
    version: "v5.3.4",
    date: "July 2026",
    announcementTitle: "Recommendations now show their artwork and active state",
    announcement: "MAT now displays poster artwork for active recommendations on profiles and clearly marks the title you are currently recommending. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Fixed missing poster artwork on profile recommendation cards, including franchise recommendations.",
        "Updated poster lookup to use the franchise cover anime when the active recommendation is a franchise."
      ],
      IMPROVED: [
        "The gold Recommend button now changes to ✓ Recommended for your active recommendation.",
        "Added a Your active recommendation label beside the button so the selected title is immediately recognizable."
      ]
    }
  },

  {
    version: "v5.3.3",
    date: "July 2026",
    announcementTitle: "Recommendation saving now completes the title correctly",
    announcement: "MAT now saves franchise recommendations using the correct collection key and confirms the title is marked Completed with the selected rating before the recommendation is created. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Fixed the user_franchises.id does not exist error when recommending a franchise.",
        "Updated franchise collection records using user_id and franchise_key, which are the actual membership keys.",
        "Confirmed anime and franchise recommendation submissions mark the collection status as Completed and save the selected personal rating before creating the recommendation."
      ]
    }
  },

  {
    version: "v5.3.2",
    date: "July 2026",
    announcementTitle: "Recommend is now visible beside Change Status",
    announcement: "The gold Recommend button now appears directly beside Change Status on anime and franchise detail pages. Updated asset versions force browsers to load the new control instead of an older cached page. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Added the gold Recommend button directly beside Change Status on owned anime detail pages.",
        "Added the same recommendation control to franchise detail pages.",
        "Added cache-busting versions to the detail-page scripts and styles so the button appears after deployment."
      ]
    }
  },

  {
    version: "v5.2.0",
    date: "July 2026",
    announcementTitle: "Recommendations are easier to find and use",
    announcement: "MAT now keeps RP visible in the navigation bar, uses a compact RP badge on profiles, adds a clear Recommend control with built-in guidelines, and places recommendations above Trending on the dashboard. View the Changelog tab for the complete details.",
    groups: {
      NEW: [
        "Added a visible Recommend button to eligible anime detail pages.",
        "Added a recommendation guide explaining eligibility, the one-active-recommendation rule, replacement behavior, optional notes, and RP rewards."
      ],
      IMPROVED: [
        "Made the RP gem and total reliably visible in the navigation bar.",
        "Reduced the RP gem to a compact badge size on profile pages.",
        "Moved Recommended by Users You Follow above Trending on the dashboard."
      ]
    }
  },

  {
    version: "v5.1.0",
    date: "July 2026",
    announcementTitle: "Follower and Following lists are now browsable",
    announcement: "MAT now lets you open Followers and Following directly from profiles and manage both lists from the Following navigation tab. Private profiles keep these lists hidden from other users. View the Changelog tab for the complete details.",
    groups: {
      NEW: [
        "Added clickable Followers and Following counts to your profile and every public user profile.",
        "Added Following, Followers, and Requests tabs to the Following navigation page.",
        "Added profile links, RP totals, and follow controls inside social lists."
      ],
      PRIVACY: [
        "Kept your own lists accessible when your profile is private.",
        "Blocked other users from opening the Followers or Following lists of private profiles."
      ]
    }
  },

  {
    version: "v5.0.0",
    date: "July 2026",
    announcementTitle: "Following, recommendations, and RP are live",
    announcement: "MAT now uses Following and Followers, supports public or private follow approval, adds one active recommendation per user, and introduces Recommendation Points with the new gem icon in the navigation bar and profile headers. View the Changelog tab for the complete details.",
    groups: {
      NEW: [
        "Added public-by-default profiles with an optional private follow-approval setting.",
        "Added one active anime or franchise recommendation with an optional note.",
        "Added Recommendation Points for collection adds, completions, ratings, and exact rating matches.",
        "Added the RP gem and clickable earning guide to the navigation bar and profile headers."
      ],
      IMPROVED: [
        "Replaced Friends terminology with Following, Followers, Follow, and Unfollow throughout MAT.",
        "Moved Followers, Following, and Joined into one profile information row.",
        "Replaced Rated by Friends with Recommended by Users You Follow."
      ]
    }
  },

  {
    version: "v4.5.1",
    date: "July 2026",
    announcementTitle: "Full badge control for administrators",
    announcement: "MAT administrators can now award or remove every badge type from the Admin Control Panel, including automatic, secret, subscription, and manual badges. View the Changelog tab for the complete details.",
    groups: {
      FIXED: [
        "Removed the manual-only restriction from the Admin Control Panel badge list.",
        "Updated the admin badge functions so authorized administrators can add or remove any badge assigned to a user."
      ]
    }
  },
  {
    version: "v4.5.0",
    date: "July 2026",
    announcementTitle: "New ways to stand out on MAT",
    announcement: "MAT now includes Event Champion, a discoverable Secret Badge, Conversation Champion reply progress, and a preview of the upcoming VIP badge. Anime Completion Master artwork has also been repaired. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added Event Champion, a permanent badge awarded or revoked through the Admin Control Panel for official MAT event and tournament winners.",
        "Added Secret Badge using the new blue artwork. Its requirement stays hidden until earned, and only the person who earned it can see the unlock explanation.",
        "Added Conversation Champion for replying to 5,000 comments, with progress based only on comments that have a parent comment.",
        "Added the upcoming VIP subscription badge preview in its own Subscription category."
      ],
      IMPROVED: [
        "Replaced the broken Anime Completion Master artwork with the new green trophy artwork.",
        "Updated automatic badge refresh logic to track genuine replies separately from top-level comments.",
        "Organized manual, secret, subscription, and automatic badges so they appear in the correct areas."
      ]
    }
  },
  {
    version: "v4.4.0",
    date: "July 2026",
    announcementTitle: "Pioneer discoveries and tougher recruiting",
    announcement: "MAT now rewards the first user to track a previously untracked anime with the permanent Pioneer badge, and Recruiter now requires three successful referrals. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added the permanent Pioneer badge for the first user to add an anime that has never been tracked on MAT before.",
        "Added official Pioneer rocket artwork to earned badge displays."
      ],
      IMPROVED: [
        "Raised the Recruiter badge requirement from one successful referral to three.",
        "Updated Recruiter progress from 0 / 1 to 0 / 3 while preserving existing referral totals and previously earned badges."
      ]
    }
  },
  {
    version: window.MAT_VERSION || "v4.3.1",
    date: "July 2026",
    announcementTitle: "Referral rewards now complete correctly",
    announcement: "MAT now records valid referrals after account confirmation, updates the inviter’s referral total, and awards the Recruiter badge automatically. View the Changelog tab for the complete list of changes.",
    groups: {
      FIXED: [
        "Fixed referral codes remaining unclaimed after a referred user created and confirmed an account.",
        "Fixed inviter referral counts staying at zero.",
        "Fixed the Recruiter badge not unlocking after the first successful referral."
      ],
      IMPROVED: [
        "Added safer duplicate and self-referral protection.",
        "Kept pending referral data until Supabase confirms that the referral was successfully claimed."
      ]
    }
  },
  {
    version: "v4.3.0",
    date: "July 2026",
    announcementTitle: "Invites and automatic badges are ready",
    announcement: "Invitation links can now fill referral codes automatically while still allowing manual edits, and MAT now uses the new artwork for automatic badges and Beta Tester. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added editable referral codes to account creation.",
        "Added automatic referral-link filling with clear signup guidance.",
        "Added automatic badge awarding for Community Favorite, Recruiter, Anime Completion Master, and Rating Legend."
      ],
      IMPROVED: [
        "Added official artwork to all four automatic badge progress cards.",
        "Replaced the Beta Tester badge artwork with the new diamond design."
      ],
      FIXED: [
        "Connected Recruiter progress to the profile referral count instead of a placeholder value."
      ]
    }
  },
  {
    version: window.MAT_VERSION || "v4.2.0",
    date: "July 2026",
    announcementTitle: "Badge progress now has a home",
    announcement: "Profiles now include a dedicated Badges button, a new page for viewing earned badges and automatic-badge progress, plus cleaner Friends and Joined information in the profile corners. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added a dedicated Badges page for earned badges and automatic-badge progress.",
        "Added progress tracking for comment likes, completed anime, rated anime, and referrals."
      ],
      IMPROVED: [
        "Moved Friends to the top-left of profile cards as plain text.",
        "Added the account join date to the top-right of profile cards.",
        "Replaced the centered Friends control with a Badges button."
      ]
    }
  },
  {
    version: window.MAT_VERSION || "v4.1.0",
    date: "July 2026",
    announcementTitle: "Community counts and easier installation",
    announcement: "Anime and franchise pages now show how many MAT collections they appear in, profiles display public friend counts, and the app install option now lives neatly in the footer. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added a clickable collection-count indicator to anime and franchise pages.",
        "Added public accepted-friend counts to user profiles.",
        "Added an Install App option to every page footer with a guided popup."
      ],
      IMPROVED: [
        "Moved installation guidance into a clean footer popup.",
        "Added clear install states for available, installed, unsupported, and temporarily unavailable situations."
      ]
    }
  },
  {
    version: "v4.0.0",
    date: "July 2026",
    announcementTitle: "Franchise tracking has arrived",
    announcement: "Long-running anime can now stay organized under one franchise, so your collection is easier to browse without losing access to individual seasons and movies. Ratings now stay connected across franchise entries as well. View the Changelog tab for the complete list of changes.",
    groups: {
      NEW: [
        "Added automatic franchise grouping for TV seasons and movies.",
        "Added franchise pages with clickable season and movie entries.",
        "Added individual entry ratings that calculate the franchise score.",
        "Added franchise format options in Settings."
      ],
      IMPROVED: [
        "Updated Collection cards and Top 5 profiles to show franchises once.",
        "Kept individual franchise entries informational while tracking stays at the franchise level.",
        "Improved franchise loading and rating synchronization."
      ],
      FIXED: [
        "Fixed franchise artwork and navigation issues.",
        "Fixed franchise entry rating saves and collection score mismatches.",
        "Added clearer offline and service-unavailable messages."
      ]
    }
  },
  {
    version: "v3.4.0",
    date: "July 2026",
    announcementTitle: "Official badges are now live",
    announcement: "Profiles can now display official MAT badges, and badge management is available through the owner-only Admin Control Panel. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added Creator, Beta Tester, and Discord Moderator badges.", "Added badge details on hover and click, including locked profiles.", "Added an owner-only Admin Control Panel with friend-code badge management."] }
  },
  {
    version: "v3.3.2",
    date: "July 2026",
    announcementTitle: "Discord support is easier to find",
    announcement: "The MAT Discord now has a clearer home in the footer, making support and suggestions easier to access. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Redesigned the Discord footer link as a MAT-themed button.", "Added the Discord logo and Support & Suggestions label."] }
  },
  {
    version: "v3.3.1",
    date: "July 2026",
    announcementTitle: "Small navigation improvements",
    announcement: "Waiting updates now lead directly where expected, and version information stays consistent across MAT. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Fixed Open Waiting so it opens the Waiting collection filter.", "Made Open Waiting visually match MAT action buttons.", "Added the MAT Discord link for support and suggestions.", "Synchronized the footer version with What's New."] }
  },
  {
    version: "v3.3.0",
    date: "July 2026",
    announcementTitle: "A more detailed rating system",
    announcement: "Ratings now use a full ten-category, ten-point system with live score updates, giving you more control over how each anime is scored. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Expanded ratings to ten categories on a 10-point scale.", "Added live slider scores and overall rating updates."], IMPROVED: ["Renamed Status & Details to Change Status."] }
  },
  {
    version: "v3.2.0",
    date: "July 2026",
    announcementTitle: "More control over your viewing experience",
    announcement: "MAT now includes poster privacy controls, cleaner account navigation, and visible version information. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added the current MAT version to page footers.", "Added a Show 18+ Posters setting that only controls sexually explicit poster blurring."], IMPROVED: ["Removed Sign Out from page headers and kept it inside Profile Settings."] }
  },
  {
    version: "v3.1.0",
    date: "July 2026",
    announcementTitle: "Public anime discussions are here",
    announcement: "You can now join public conversations on anime pages with comments, replies, likes, and sorting. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added public comments to every anime.", "Added comment likes, replies, and sorting by Relevant, Recent, or Oldest.", "Added locked commenter profiles with friend request options."] }
  },
  {
    version: "v3.0.5",
    date: "July 2026",
    announcementTitle: "Dashboard and ratings cleanup",
    announcement: "The Dashboard is more focused, and completed-anime ratings are easier to manage from one place. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Removed Continue Watching from the Dashboard.", "Matched the What's New and Waiting Updates mini-section layouts.", "Limited anime ratings to Completed titles.", "Improved rating controls across Collection, Details, Friends, and Ratings."] }
  },
  {
    version: "v3.0.4",
    date: "July 2026",
    announcementTitle: "Profiles now show more of your anime identity",
    announcement: "Stats and Top 5 Anime moved to profiles, while the Dashboard became cleaner and more focused on current activity. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Moved anime statistics and Top 5 Anime to user profiles.", "Redesigned profiles and moved editing controls into Settings.", "Cleaned up and reordered the Dashboard."] }
  },
  {
    version: "v3.0.3",
    date: "July 2026",
    announcementTitle: "Invite friends and follow MAT updates",
    announcement: "Friend invites and the first What's New experience were added to make MAT easier to share and keep up with. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added Invite Friends sharing tools.", "Added the What's New section."] }
  },
  {
    version: "v3.0.2",
    date: "July 2026",
    announcementTitle: "Signup is clearer",
    announcement: "New users now receive a clearer reminder to confirm their account before signing in. View the Changelog tab for the complete list of changes.",
    groups: { IMPROVED: ["Improved the signup confirmation experience.", "Added a clear reminder to check for the confirmation email from Supabase."] }
  },
  {
    version: "v3.0.1",
    date: "July 2026",
    announcementTitle: "MAT is easier to install",
    announcement: "The install experience and mobile navigation were improved so MAT works more naturally as an app. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Added the Install MAT button."], FIXED: ["Fixed the oversized MAT logo on mobile."] }
  },
  {
    version: "v3.0.0",
    date: "July 2026",
    announcementTitle: "Welcome to My Anime Tracker",
    announcement: "Anime Collection became My Anime Tracker, complete with MAT branding, an installable PWA, and richer anime details. View the Changelog tab for the complete list of changes.",
    groups: { NEW: ["Rebranded the app to My Anime Tracker (MAT).", "Added PWA installation support and the MAT app icon.", "Added universal anime details with trailers and collapsible descriptions."] }
  }
];

(function initWhatsNew() {
  const openButton = document.getElementById("openChangelogBtn");
  const modal = document.getElementById("changelogModal");
  const closeButton = document.getElementById("closeChangelogBtn");
  const announcementList = document.getElementById("announcementList");
  const changelogList = document.getElementById("changelogList");
  const announcementTab = document.getElementById("announcementsTab");
  const changelogTab = document.getElementById("changelogTab");
  const announcementPanel = document.getElementById("announcementsPanel");
  const changelogPanel = document.getElementById("changelogPanel");

  if (!openButton || !modal || !closeButton || !announcementList || !changelogList || !announcementTab || !changelogTab || !announcementPanel || !changelogPanel) return;

  const preview = document.getElementById("latestChangelogPreview");
  const announcements = MAT_RELEASES.filter((entry) => entry.isAnnouncement !== false && entry.announcementTitle && entry.announcement);
  const latestAnnouncement = announcements[0];
  const announcementStorageKey = "mat-last-viewed-announcement";
  const viewedAnnouncement = localStorage.getItem(announcementStorageKey);
  const hasUnreadAnnouncement = Boolean(latestAnnouncement && viewedAnnouncement !== latestAnnouncement.version);
  openButton.classList.toggle("has-unread-announcement", hasUnreadAnnouncement);
  announcementTab.classList.toggle("has-unread-announcement", hasUnreadAnnouncement);

  if (preview && latestAnnouncement) {
    preview.innerHTML = `
      <span class="dashboard-mini-icon">📢</span>
      <div>
        <strong>${escapeHtml(latestAnnouncement.announcementTitle)}</strong>
        <p>${escapeHtml(latestAnnouncement.announcement)}</p>
      </div>
    `;
  }

  announcementList.innerHTML = announcements.map((entry) => `
    <article class="announcement-entry">
      <div class="announcement-entry-heading">
        <div>
          <strong>${escapeHtml(entry.announcementTitle)}</strong>
          <span>${escapeHtml(entry.version)} • ${escapeHtml(entry.date)}</span>
        </div>
      </div>
      <p>${escapeHtml(entry.announcement)}</p>
    </article>
  `).join("");

  changelogList.innerHTML = MAT_RELEASES.map((entry) => {
    const groups = Object.entries(entry.groups || {}).filter(([, changes]) => Array.isArray(changes) && changes.length);
    return `
      <article class="changelog-entry">
        <div class="changelog-entry-heading">
          <strong>${escapeHtml(entry.version)}</strong>
          <span>${escapeHtml(entry.date)}</span>
        </div>
        ${groups.map(([label, changes]) => `
          <section class="changelog-group">
            <h3>${escapeHtml(label)}</h3>
            <ul>${changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
          </section>
        `).join("")}
      </article>
    `;
  }).join("");

  function selectTab(tab) {
    const showingAnnouncements = tab === "announcements";
    announcementTab.classList.toggle("is-active", showingAnnouncements);
    changelogTab.classList.toggle("is-active", !showingAnnouncements);
    announcementTab.setAttribute("aria-selected", String(showingAnnouncements));
    changelogTab.setAttribute("aria-selected", String(!showingAnnouncements));
    announcementPanel.hidden = !showingAnnouncements;
    changelogPanel.hidden = showingAnnouncements;
  }

  const open = () => {
    selectTab("announcements");
    modal.hidden = false;
    document.body.classList.add("modal-open");
    if (latestAnnouncement) {
      localStorage.setItem(announcementStorageKey, latestAnnouncement.version);
      openButton.classList.remove("has-unread-announcement");
      announcementTab.classList.remove("has-unread-announcement");
    }
    announcementTab.focus();
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    openButton.focus();
  };

  announcementTab.addEventListener("click", () => selectTab("announcements"));
  changelogTab.addEventListener("click", () => selectTab("changelog"));
  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) close();
  });
})();

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
