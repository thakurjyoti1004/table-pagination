import { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "../pagination";

const Table = () => {
  const [responseData, setResponseData] = useState([]);
  const [paginatedData, setPaginatedData] = useState([]);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchTableData();
  }, []);

  const fetchTableData = async () => {
    const response = await axios.get(
      "https://openlibrary.org/people/mekBot/books/want-to-read.json"
    );
    setResponseData(response.data.reading_log_entries);

    const booksData = response.data.reading_log_entries.slice(0, 10);

    const promises = booksData.map(async (book) => {
      const authorEndPoint = book.work.author_names[0];
      const authorData = await axios.get(
        `https://openlibrary.org/search/authors.json?q=${authorEndPoint}&limit=1`
      );
      // Append the fetched author data to the book object
      return { ...book, author: authorData.data };
    });

    const pageData = await Promise.all(promises);

    console.log(pageData, "pageData");
    setPaginatedData(pageData);
  };

  return (
    <div className="table_div">
      <table>
        <thead>
          <th>Author name</th>
          <th>Title</th>
          <th>First publish year</th>
          <th>Subject</th>
          <th>Author_Birth_Date</th>
          <th>Author_Top_Work</th>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  );
};
export default Table;
