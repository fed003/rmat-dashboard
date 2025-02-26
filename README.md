This app takes input from 3 CSV files and generates a map and data table to display the loaded data. The target geography for the entire app is the state of California. The CSV files are:

RMATs.csv - has information related to a region, called an RMAT
Columns: RmatNumber,AdsRep,AdsRepColor,ClientAdvisor,ClientAdvisorColor

ZipCodes.csv - has information about California ZipCodes including an RmatNumber column to link it to the RMATs data
Columns: ZipCode,TotalNumberOfCompanies,TotalEmployees,TotalSales,City,County,RmatNumber

This app is a small interactive web app designed to assist the sales manager on my team. She needs a way to analyze our client and potential client data and would like to be able to filter the data by various criteria. The app needs to be user-friendly and intuitive.

She's asked for the following features:

1. View data on a map, color coded by grouping
2. Be able to select the grouping from a dropdown menu
   a. Options: AdsRep, ClientAdvisor, County
   b. We will make ClientAdvisor the default, but in a future update will store the selected value in localstorage
3. Companies are assigned to a region, called an RMAT, by their zipcode
   a. RMATs are assigned to account development specialists, called AdsReps, as well as sales people, called client advisors
4. Filter data by RMAT, AdsRep, ClientAdvisor and/or County
   a. Currently only RMAT and ClientAdvisor are setup and are all single-select dropdowns
   b. A future update will add the others and make them all multi-select
5. View a list of data in a table, initially grouped by the previously selected grouping option
   a. Each grouping should be expandable and when expanded will show the underlying RMATs - we don't need to see individual ZipCode data in this table
6. From the map, hovering over a ZipCode shows related data in a floating window click
7. When the user clicks on a zipcode, a dialog opens that allows them to move it into a different RMAT
   a. The original RMAT and associated data are stored as part of the ZipCode object so that we can revert these changes later
   b. The ZipCode data are stored in a Pinia data store as part of the state, so that all components update when the state changes
8. We maintain a changelog of all changes and have a button to revert all changes
   a. In a future update, we will allow for reverting single changes - however we must verify that the change being reverted is the last change for that ZipCode or disable the revert option for all but the last change if a ZipCode is updated more than once

The app is broken into a few components

1. App.vue - main app component. Holds the basic layout and top-level elements
2. RmatMap.vue - holds the map for visually displaying the geographic data. Uses vue-leaflet and Leaflet to display the data.
3. RmatDataTable.vue - holds the data table and associated grouping logic
4. NavigationDrawer.vue - holds the sidebar navigation drawer that contains the grouping and filtering options, as well as the changelog
5. Changelog.vue - holds the changelog and revert changes button
6. ZipCodeDataCard.vue - the floating window that displays ZipCode detail data when the user hovers over a ZipCode on the map
