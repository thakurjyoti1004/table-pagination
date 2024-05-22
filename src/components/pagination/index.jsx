import "../pagination/style.css";

const Pagination = ({ pages, onPageClick, activeBtn }) => {
  const getButton = () => {
    const arr = [];
    for (let i = 1; i <= pages; i++) {
      arr.push(
        <button
          className={`page-btn ${activeBtn === i ? "active" : "not-active"}`}
          onClick={() => {
            onPageClick(i);
          }}
        >
          {i}
        </button>
      );
    }
    return arr;
  };

  return (
    <div className="pagenation-div">
      <button
        className="next-btn"
        disabled={activeBtn === pages}
        onClick={() => {
          onPageClick(activeBtn + 1);
        }}
      >
        {">"}
      </button>
      {getButton()}
      <button
        className="prev-btn"
        disabled={activeBtn === 1}
        onClick={() => {
          onPageClick(activeBtn - 1);
        }}
      >
        {"<"}
      </button>
    </div>
  );
};

export default Pagination;
