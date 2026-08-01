from sscatfacts.domain.facts import fact_content_hash, normalize_fact_text


def test_normalize_fact_text_collapses_whitespace() -> None:
    assert normalize_fact_text("  Cats\n are\t great.  ") == "Cats are great."


def test_fact_content_hash_uses_sha256() -> None:
    assert fact_content_hash("abc") == (
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )
