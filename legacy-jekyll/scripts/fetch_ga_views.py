#!/usr/bin/env python3
"""
Google Analytics View Counter Fetcher

This script fetches view counts for all pages on your Jekyll site from Google Analytics.
Supports both Universal Analytics (UA) and Google Analytics 4 (GA4).

Setup Instructions:
1. Install required packages:
   pip install google-analytics-data google-api-python-client pyyaml

2. For Universal Analytics (UA):
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing one
   - Enable "Google Analytics Reporting API"
   - Create credentials (OAuth 2.0 Client ID) or Service Account
   - Download credentials JSON file
   - Set GOOGLE_APPLICATION_CREDENTIALS environment variable or use --credentials flag

3. For Google Analytics 4 (GA4):
   - Go to https://console.cloud.google.com/
   - Enable "Google Analytics Data API"
   - Create Service Account and download JSON key
   - In GA4, go to Admin > Property Access Management
   - Add the service account email with "Viewer" role
   - Use --ga4-property-id flag with your GA4 property ID

Usage:
    python fetch_ga_views.py --mode ua --view-id VIEW_ID
    python fetch_ga_views.py --mode ga4 --ga4-property-id PROPERTY_ID
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

try:
    import yaml
except ImportError:
    print("Error: pyyaml not installed. Run: pip install pyyaml")
    sys.exit(1)

# Try importing GA libraries
try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Metric,
        RunReportRequest,
    )

    GA4_AVAILABLE = True
except ImportError:
    GA4_AVAILABLE = False
    print(
        "Warning: GA4 library not available. Install: pip install google-analytics-data"
    )

try:
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
    from google_auth_oauthlib.flow import InstalledAppFlow

    UA_AVAILABLE = True
except ImportError:
    UA_AVAILABLE = False
    print(
        "Warning: UA library not available. Install: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib"
    )


class PageCollector:
    """Collects all pages from the Jekyll site."""

    def __init__(self, site_root: Path):
        self.site_root = site_root
        self.config_path = site_root / "_config.yml"
        self.posts_dir = site_root / "_posts"

    def load_config(self) -> dict:
        """Load Jekyll config file."""
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading config: {e}")
            return {}

    def get_blog_posts(self) -> List[Dict[str, str]]:
        """Get all blog posts with their URLs."""
        posts = []
        config = self.load_config()
        permalink_pattern = config.get("permalink", "/:year-:month-:day-:title/")
        baseurl = config.get("baseurl", "")
        url = config.get("url", "")

        if not self.posts_dir.exists():
            return posts

        for post_file in sorted(self.posts_dir.glob("*.md")):
            try:
                # Parse front matter
                with open(post_file, "r", encoding="utf-8") as f:
                    content = f.read()

                if not content.startswith("---"):
                    continue

                # Extract front matter
                parts = content.split("---", 2)
                if len(parts) < 3:
                    continue

                front_matter = yaml.safe_load(parts[1])
                if not front_matter:
                    continue

                # Get post metadata
                title = front_matter.get("title", post_file.stem)
                date_str = post_file.stem[:10]  # YYYY-MM-DD

                # Build URL from permalink pattern
                year, month, day = date_str.split("-")
                slug = post_file.stem[11:]  # Remove date prefix

                page_url = (
                    permalink_pattern.replace(":year", year)
                    .replace(":month", month)
                    .replace(":day", day)
                    .replace(":title", slug)
                )

                # Remove leading/trailing slashes and add baseurl
                page_url = page_url.strip("/")
                if baseurl:
                    page_url = f"{baseurl}/{page_url}".replace("//", "/")
                else:
                    page_url = f"/{page_url}"

                posts.append(
                    {"title": title, "url": page_url, "date": date_str, "type": "post"}
                )
            except Exception as e:
                print(f"Error processing {post_file}: {e}")
                continue

        return posts

    def get_main_pages(self) -> List[Dict[str, str]]:
        """Get main site pages."""
        config = self.load_config()
        baseurl = config.get("baseurl", "")

        pages = [
            {"title": "Home", "url": "/", "type": "page"},
            {"title": "About Me", "url": "/aboutme/", "type": "page"},
            {"title": "Blog", "url": "/blog/", "type": "page"},
            {"title": "Tags", "url": "/tags/", "type": "page"},
        ]

        # Add baseurl if present
        if baseurl:
            for page in pages:
                if page["url"] != "/":
                    page["url"] = f"{baseurl}{page['url']}".replace("//", "/")

        return pages

    def get_all_pages(self) -> List[Dict[str, str]]:
        """Get all pages (main pages + blog posts)."""
        all_pages = self.get_main_pages() + self.get_blog_posts()
        return all_pages


class GAFetcher:
    """Base class for fetching Google Analytics data."""

    def __init__(self):
        self.results = []

    def fetch_views(self, pages: List[Dict[str, str]]) -> List[Dict[str, any]]:
        """Fetch view counts for all pages. Override in subclasses."""
        raise NotImplementedError


class UAFetcher(GAFetcher):
    """Fetcher for Universal Analytics (UA)."""

    def __init__(self, view_id: str, credentials_path: Optional[str] = None):
        super().__init__()
        self.view_id = view_id
        self.credentials_path = credentials_path
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Google Analytics Reporting API."""
        if not UA_AVAILABLE:
            raise ImportError(
                "UA libraries not installed. Run: pip install google-api-python-client"
            )

        SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

        # Try service account first
        if self.credentials_path and os.path.exists(self.credentials_path):
            try:
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path, scopes=SCOPES
                )
                self.service = build(
                    "analyticsreporting", "v4", credentials=credentials
                )
                print("✓ Authenticated using service account")
                return
            except Exception as e:
                print(f"Service account auth failed: {e}")

        # Try environment variable
        creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if creds_path and os.path.exists(creds_path):
            try:
                credentials = service_account.Credentials.from_service_account_file(
                    creds_path, scopes=SCOPES
                )
                self.service = build(
                    "analyticsreporting", "v4", credentials=credentials
                )
                print("✓ Authenticated using GOOGLE_APPLICATION_CREDENTIALS")
                return
            except Exception as e:
                print(f"Env var auth failed: {e}")

        # OAuth flow (interactive)
        print("Attempting OAuth flow...")
        print("Note: You may need to set up OAuth credentials in Google Cloud Console")
        flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
        credentials = flow.run_local_server(port=0)
        self.service = build("analyticsreporting", "v4", credentials=credentials)
        print("✓ Authenticated using OAuth")

    def fetch_views(self, pages: List[Dict[str, str]]) -> List[Dict[str, any]]:
        """Fetch view counts for all pages from UA."""
        if not self.service:
            raise Exception("Not authenticated. Please set up credentials.")

        results = []

        print(
            f"\nFetching view counts for {len(pages)} pages from Universal Analytics..."
        )
        print(f"View ID: {self.view_id}\n")

        # Fetch all page views in batches
        page_paths = [page["url"].strip("/") or "/" for page in pages]

        # Query GA for page views
        # Note: UA API has limits, so we'll query all pages together
        try:
            request = {
                "viewId": self.view_id,
                "dateRanges": [{"startDate": "2020-01-01", "endDate": "today"}],
                "metrics": [{"expression": "ga:pageviews"}],
                "dimensions": [{"name": "ga:pagePath"}],
                "dimensionFilterClauses": [
                    {
                        "filters": [
                            {
                                "dimensionName": "ga:pagePath",
                                "operator": "IN_LIST",
                                "expressions": page_paths,
                            }
                        ]
                    }
                ],
            }

            response = (
                self.service.reports()
                .batchGet(body={"reportRequests": [request]})
                .execute()
            )

            # Parse response
            page_views = {}
            if "reports" in response and len(response["reports"]) > 0:
                report = response["reports"][0]
                if "rows" in report["data"]:
                    for row in report["data"]["rows"]:
                        path = row["dimensions"][0]
                        views = int(row["metrics"][0]["values"][0])
                        page_views[path] = views

            # Match with pages
            for page in pages:
                page_path = page["url"].strip("/") or "/"
                views = page_views.get(page_path, page_views.get(f"/{page_path}", 0))

                results.append(
                    {
                        "title": page["title"],
                        "url": page["url"],
                        "type": page["type"],
                        "views": views,
                        "date": page.get("date", ""),
                    }
                )

            print(f"✓ Fetched data for {len(results)} pages")

        except Exception as e:
            print(f"Error fetching data: {e}")
            print("\nTrying alternative method (individual queries)...")

            # Fallback: query pages individually
            for i, page in enumerate(pages, 1):
                try:
                    page_path = page["url"].strip("/") or "/"
                    request = {
                        "viewId": self.view_id,
                        "dateRanges": [{"startDate": "2020-01-01", "endDate": "today"}],
                        "metrics": [{"expression": "ga:pageviews"}],
                        "dimensions": [{"name": "ga:pagePath"}],
                        "filtersExpression": f"ga:pagePath=={page_path}",
                    }

                    response = (
                        self.service.reports()
                        .batchGet(body={"reportRequests": [request]})
                        .execute()
                    )

                    views = 0
                    if "reports" in response and len(response["reports"]) > 0:
                        report = response["reports"][0]
                        if "rows" in report.get("data", {}):
                            views = int(
                                report["data"]["rows"][0]["metrics"][0]["values"][0]
                            )

                    results.append(
                        {
                            "title": page["title"],
                            "url": page["url"],
                            "type": page["type"],
                            "views": views,
                            "date": page.get("date", ""),
                        }
                    )

                    if i % 10 == 0:
                        print(f"  Processed {i}/{len(pages)} pages...")

                except Exception as e:
                    print(f"  Error fetching {page['url']}: {e}")
                    results.append(
                        {
                            "title": page["title"],
                            "url": page["url"],
                            "type": page["type"],
                            "views": 0,
                            "date": page.get("date", ""),
                        }
                    )

        return results


class GA4Fetcher(GAFetcher):
    """Fetcher for Google Analytics 4 (GA4)."""

    def __init__(self, property_id: str, credentials_path: Optional[str] = None):
        super().__init__()
        self.property_id = property_id
        self.credentials_path = credentials_path
        self.client = None
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Google Analytics Data API."""
        if not GA4_AVAILABLE:
            raise ImportError(
                "GA4 library not installed. Run: pip install google-analytics-data"
            )

        # Try service account
        if self.credentials_path and os.path.exists(self.credentials_path):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.credentials_path

        # Try environment variable
        elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            pass  # Use existing env var
        else:
            print("Warning: No credentials found. Using default credentials.")
            print("Set GOOGLE_APPLICATION_CREDENTIALS or use --credentials flag")

        try:
            self.client = BetaAnalyticsDataClient()
            print("✓ Authenticated with GA4")
        except Exception as e:
            raise Exception(f"Authentication failed: {e}")

    def fetch_views(self, pages: List[Dict[str, str]]) -> List[Dict[str, any]]:
        """Fetch view counts for all pages from GA4."""
        if not self.client:
            raise Exception("Not authenticated. Please set up credentials.")

        results = []

        print(
            f"\nFetching view counts for {len(pages)} pages from Google Analytics 4..."
        )
        print(f"Property ID: {self.property_id}\n")

        # Build page paths
        page_paths = [page["url"].strip("/") or "/" for page in pages]

        try:
            # Query GA4 for all pages
            request = RunReportRequest(
                property=f"properties/{self.property_id}",
                date_ranges=[DateRange(start_date="2020-01-01", end_date="today")],
                dimensions=[Dimension(name="pagePath")],
                metrics=[Metric(name="screenPageViews")],
                dimension_filter={
                    "filter": {
                        "field_name": "pagePath",
                        "in_list_filter": {"values": page_paths},
                    }
                },
            )

            response = self.client.run_report(request)

            # Parse response
            page_views = {}
            for row in response.rows:
                path = row.dimension_values[0].value
                views = int(row.metric_values[0].value)
                page_views[path] = views

            # Match with pages
            for page in pages:
                page_path = page["url"].strip("/") or "/"
                views = page_views.get(page_path, page_views.get(f"/{page_path}", 0))

                results.append(
                    {
                        "title": page["title"],
                        "url": page["url"],
                        "type": page["type"],
                        "views": views,
                        "date": page.get("date", ""),
                    }
                )

            print(f"✓ Fetched data for {len(results)} pages")

        except Exception as e:
            print(f"Error fetching data: {e}")
            print("\nTrying alternative method (individual queries)...")

            # Fallback: query pages individually
            for i, page in enumerate(pages, 1):
                try:
                    page_path = page["url"].strip("/") or "/"
                    request = RunReportRequest(
                        property=f"properties/{self.property_id}",
                        date_ranges=[
                            DateRange(start_date="2020-01-01", end_date="today")
                        ],
                        dimensions=[Dimension(name="pagePath")],
                        metrics=[Metric(name="screenPageViews")],
                        dimension_filter={
                            "filter": {
                                "field_name": "pagePath",
                                "string_filter": {
                                    "match_type": "EXACT",
                                    "value": page_path,
                                },
                            }
                        },
                    )

                    response = self.client.run_report(request)

                    views = 0
                    if response.rows:
                        views = int(response.rows[0].metric_values[0].value)

                    results.append(
                        {
                            "title": page["title"],
                            "url": page["url"],
                            "type": page["type"],
                            "views": views,
                            "date": page.get("date", ""),
                        }
                    )

                    if i % 10 == 0:
                        print(f"  Processed {i}/{len(pages)} pages...")

                except Exception as e:
                    print(f"  Error fetching {page['url']}: {e}")
                    results.append(
                        {
                            "title": page["title"],
                            "url": page["url"],
                            "type": page["type"],
                            "views": 0,
                            "date": page.get("date", ""),
                        }
                    )

        return results


def export_to_csv(results: List[Dict], output_file: str):
    """Export results to CSV."""
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        if not results:
            return

        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

    print(f"\n✓ Exported results to {output_file}")


def export_to_json(results: List[Dict], output_file: str):
    """Export results to JSON."""
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"✓ Exported results to {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Fetch view counts from Google Analytics for all Jekyll site pages",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    parser.add_argument(
        "--mode",
        choices=["ua", "ga4"],
        required=True,
        help="Analytics mode: ua (Universal Analytics) or ga4 (Google Analytics 4)",
    )

    parser.add_argument(
        "--view-id",
        help="Universal Analytics View ID (for UA mode). Find in GA Admin > View Settings",
    )

    parser.add_argument(
        "--ga4-property-id", help="GA4 Property ID (for GA4 mode). Format: 123456789"
    )

    parser.add_argument(
        "--credentials", help="Path to service account credentials JSON file"
    )

    parser.add_argument(
        "--site-root",
        default=".",
        help="Path to Jekyll site root directory (default: current directory)",
    )

    parser.add_argument(
        "--output",
        default="ga_views",
        help="Output file prefix (default: ga_views). Files will be .csv and .json",
    )

    args = parser.parse_args()

    # Validate arguments
    if args.mode == "ua" and not args.view_id:
        parser.error("--view-id is required for UA mode")

    if args.mode == "ga4" and not args.ga4_property_id:
        parser.error("--ga4-property-id is required for GA4 mode")

    # Get site root
    site_root = Path(args.site_root).resolve()
    if not site_root.exists():
        print(f"Error: Site root not found: {site_root}")
        sys.exit(1)

    # Collect pages
    print("Collecting pages from Jekyll site...")
    collector = PageCollector(site_root)
    pages = collector.get_all_pages()
    print(
        f"✓ Found {len(pages)} pages ({len(collector.get_main_pages())} main pages, {len(collector.get_blog_posts())} blog posts)"
    )

    # Fetch views
    try:
        if args.mode == "ua":
            fetcher = UAFetcher(args.view_id, args.credentials)
        else:
            fetcher = GA4Fetcher(args.ga4_property_id, args.credentials)

        results = fetcher.fetch_views(pages)

        # Sort by views (descending)
        results.sort(key=lambda x: x["views"], reverse=True)

        # Export results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_file = f"{args.output}_{timestamp}.csv"
        json_file = f"{args.output}_{timestamp}.json"

        export_to_csv(results, csv_file)
        export_to_json(results, json_file)

        # Print summary
        total_views = sum(r["views"] for r in results)
        print(f"\n{'='*60}")
        print(f"Summary:")
        print(f"  Total pages: {len(results)}")
        print(f"  Total views: {total_views:,}")
        print(
            f"  Average views per page: {total_views // len(results) if results else 0:,}"
        )
        print(f"\nTop 10 pages by views:")
        for i, page in enumerate(results[:10], 1):
            print(f"  {i:2}. {page['title'][:40]:40} - {page['views']:>8,} views")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
