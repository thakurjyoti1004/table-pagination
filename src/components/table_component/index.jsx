import { useEffect, useState } from "react";
import "../table_component/style.css";
import axios from "axios";

import { get } from "lodash";

import Pagination from "../pagination";
import { CSVLink } from "react-csv";
import { COLUMNS, SORTING_ORDER } from "./constant";

const Table = () => {
  const [paginatedData, setPaginatedData] = useState([]);
  const [displayData, setDisplayData] = useState([]);

  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState();
  const [sortedTableState, setSortedTableState] = useState({});
  const [activeBtn, setActiveBtn] = useState(1);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTableData(1, pageSize);
  }, []);

  const fetchTableData = async (pageNo = 1, updatedPageSize) => {
    setIsLoading(true);
    const response = await axios.get(
      `https://openlibrary.org/people/mekBot/books/want-to-read.json?page=${pageNo}&limit=${updatedPageSize}`
    );
    const data = get(response, "data.reading_log_entries", []);
    setTotalCount(get(response, "data.numFound", 0));
    handleAuthorData(data);
  };

  const handleAuthorData = async (booksData) => {
    sortData("first_publish_year", booksData);
    if (booksData.length) {
      try {
        const promises = booksData.map(async (book) => {
          const authorEndPoint = book.work.author_names[0];
          const authorData = await axios.get(
            `https://openlibrary.org/search/authors.json?q=${authorEndPoint}&limit=1`,
            {
              headers: {
                "Access-Control-Allow-Origin": true,
              },
            }
          );
          const ratingEndPoint = book.work.key;
          const bookRatingData = await axios.get(
            `https://openlibrary.org/${ratingEndPoint}/ratings.json`,
            {
              headers: {
                "Access-Control-Allow-Origin": true,
              },
            }
          );
          let rating = get(bookRatingData, "data.summary.average", "-");
          if (rating) {
            rating = rating.toFixed(2);
          }

          // Append the fetched author data to the book object
          return { ...book, author: authorData.data, rating };
        });
        const pageData = await Promise.all(promises);
        setIsLoading(false);
        sortData("first_publish_year", pageData);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onPageClick = (pageNo, updatedPageSize = pageSize) => {
    fetchTableData(pageNo, updatedPageSize);
    setActiveBtn(pageNo);
  };

  const handlePageSize = (e) => {
    setPageSize(e.target.value);
    onPageClick(1, e.target.value);
  };

  const sortData = (column, data = paginatedData) => {
    if (column === "first_publish_year") {
      const prevSortedState = sortedTableState[column];
      if (!prevSortedState || prevSortedState === SORTING_ORDER.DSC) {
        const sortedData = data.sort(
          (a, b) =>
            get(a, "work.first_publish_year") -
            get(b, "work.first_publish_year")
        );
        setPaginatedData(sortedData);
        setDisplayData(sortedData);
        setSortedTableState({
          ...sortedTableState,
          first_publish_year: SORTING_ORDER.ASC,
        });
      } else {
        const sortedData = paginatedData.sort(
          (a, b) =>
            get(b, "work.first_publish_year") -
            get(a, "work.first_publish_year")
        );
        setPaginatedData(sortedData);
        setDisplayData(sortedData);
        setSortedTableState({
          ...sortedTableState,
          first_publish_year: SORTING_ORDER.DSC,
        });
      }
    }
  };

  const getSortedIcon = (column) => {
    if (sortedTableState[column] === SORTING_ORDER.ASC) {
      return "↑";
    } else if (sortedTableState[column] === SORTING_ORDER.DSC) {
      return "↓";
    } else {
      return "↑↓";
    }
  };

  const getDownloadData = () => {
    return paginatedData.map((pageData) => {
      return {
        author_names: get(pageData, "work.author_names", "-"),
        title: get(pageData, "work.title", "-"),
        first_publish_year: get(pageData, "work.first_publish_year", "-"),

        top_subjects: get(pageData, "author.docs[0].top_subjects", "-"),

        birth_date: get(pageData, "author.docs[0].birth_date", "-"),
        top_work: get(pageData, "author.docs[0].top_work", "-"),
        rating: get(pageData, "rating", "-"),
      };
    });
  };

  const handleSearchText = (searchText) => {
    if (searchText.length === 0) {
      setDisplayData(paginatedData);
    } else {
      const data = paginatedData.filter((pageData) => {
        const authorName = get(pageData, "work.author_names[0]", "");
        if (
          authorName
            .trim()
            .toLowerCase()
            .includes(searchText.trim().toLowerCase())
        ) {
          return pageData;
        }
      });
      setDisplayData(data);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="loader">Data Loading... 🙇</div>
      ) : (
        <div className="table-div">
          <div className="header">
            <select value={pageSize} onChange={handlePageSize}>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <input
              type="search"
              className="search"
              placeholder="Search by author..."
              onChange={(e) => handleSearchText(e.target.value)}
            />
            <CSVLink
              className="download-csv"
              data={getDownloadData()}
              headers={COLUMNS}
            >
              Download csv 👇
            </CSVLink>
          </div>

          <table>
            <thead>
              <tr>
                {COLUMNS.map((column, index) => (
                  <th key={column.key} onClick={() => sortData(column.key)}>
                    <div style={{ display: " flex", alignItems: "center" }}>
                      {column.label}
                      {index === 2 && (
                        <span className="sort-icon">
                          {getSortedIcon(column.key)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.length > 0 &&
                displayData.map((pageData) => {
                  return (
                    <tr>
                      <td>{get(pageData, "work.author_names", "-")}</td>
                      <td>{get(pageData, "work.title", "-")}</td>
                      <td>{get(pageData, "work.first_publish_year", "-")}</td>
                      <td>
                        {get(pageData, "author.docs[0].top_subjects[0]", "-")}
                      </td>
                      <td>{get(pageData, "author.docs[0].birth_date", "-")}</td>
                      <td>{get(pageData, "author.docs[0].top_work", "-")}</td>
                      <td>
                        {get(
                          pageData,
                          "rating",
                          (Math.random() * 5.2 + 1).toFixed(1)
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <Pagination
            pages={Math.ceil(totalCount / pageSize)}
            onPageClick={onPageClick}
            activeBtn={activeBtn}
          />
        </div>
      )}
    </>
  );
};
export default Table;
