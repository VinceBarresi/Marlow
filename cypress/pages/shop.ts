export class Shop {
  
static shopTitle = "[data-testid=shop-title]";

static shopCount = "[data-testid=shop-count]";

// search form
static searchForm = "[data-testid=search-form]";

// search input
static searchInput = "[data-testid=search-input]";

// search button
static searchButton = "[data-testid=search-button]";

// search results
static searchResults = "[data-testid=search-results]";

// search result item
static searchResultItem = "[data-testid=search-result-item]";

// search result item title
static searchResultItemTitle = "[data-testid=search-result-item-title]";

// shop categiries
static shopCategories = "[data-testid=shop-categories]";

// shop category item
static shopCategoryItem = "[data-testid=shop-category-item]";

// shop category item title
static shopCategoryItemTitle = "[data-testid=shop-category-item-title]";

// shop category item count
static shopCategoryItemCount = "[data-testid=shop-category-item-count]";

 static visit() {
    cy.visit("/");
 }
}
