import { useState, useEffect } from "react";
import { contains, attribute, literal } from "mendix/filters/builders";

export function useSearch(datasource, userNameAttr, setCurrentPage) {
    const [searchText, setSearchText] = useState("");

    // Apply search filter
    useEffect(() => {
        if (datasource && datasource.setFilter && userNameAttr) {
            if (searchText.trim()) {
                const filterCondition = contains(attribute(userNameAttr.id), literal(searchText));
                datasource.setFilter(filterCondition);
            } else {
                datasource.setFilter(undefined);
            }
        }
    }, [searchText, datasource, userNameAttr]);

    // Reset to page 1 only when search text changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, setCurrentPage]);

    return { searchText, setSearchText };
}
